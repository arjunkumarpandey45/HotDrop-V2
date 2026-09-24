package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.NotificationResponseDto;
import com.arjun.hotdrop_backend.entity.Notification;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.repository.NotificationRepo;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.utils.MaskUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepo notificationRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.arjun.hotdrop_backend.repository.UserRepo userRepo;
    private final com.arjun.hotdrop_backend.repository.PostRepo postRepo;

    @Transactional
    public void sendNotification(User sender, User recipient, NotificationType type, String message, UUID referenceId) {
        if (sender != null && recipient != null && sender.getId().equals(recipient.getId())
                && type != NotificationType.PROJECT_DEAD
                && type != NotificationType.PROJECT_LIVE) {
            log.info("Skipping notification because sender and recipient are the same user ({}).", sender.getHotdropId());
            return;
        }

        log.info("Creating {} notification for user: {}", type, recipient != null ? recipient.getHotdropId() : "unknown");

        Notification notification = Notification.builder()
                .sender(sender)
                .recipient(recipient)
                .type(type)
                .message(message)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepo.save(notification);

        String postShareUrl = null;
        if (referenceId != null && (type == NotificationType.LIKE || type == NotificationType.COMMENT
                || type == NotificationType.PROJECT_DEAD || type == NotificationType.PROJECT_LIVE)) {
            postShareUrl = postRepo.findById(referenceId)
                    .map(Post::getShareUrl)
                    .orElse(null);
        }

        NotificationResponseDto payload = NotificationResponseDto.builder()
                .id(saved.getId())
                .senderHotdropId(sender != null ? sender.getHotdropId() : "HotDrop")
                .senderProfilePicture(sender != null ? sender.getProfileImageUrl() : null)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .shareUrl(postShareUrl)
                .isRead(false)
                .createdAt(saved.getCreatedAt())
                .build();

        messagingTemplate.convertAndSendToUser(
                recipient.getHotdropId(),
                "/queue/notifications",
                payload
        );

        log.info("Sent live notification to user: @{}", recipient.getHotdropId());
    }

    @Override
    public org.springframework.data.domain.Page<NotificationResponseDto> getUserNotifications(String hotdropId, org.springframework.data.domain.Pageable pageable) {
        log.info("Getting notifications for user: {}", MaskUtils.maskIdentifier(hotdropId));

        User user = userRepo.findByHotdropId(hotdropId)
                .or(() -> userRepo.findByEmail(hotdropId))
                .orElseThrow(() -> {
                    log.warn("Cannot get notifications: user not found for {}", MaskUtils.maskIdentifier(hotdropId));
                    return new RuntimeException("User not found: " + hotdropId);
                });

        org.springframework.data.domain.Page<NotificationResponseDto> result = notificationRepo.findByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(n -> {
                    String postShareUrl = null;
                    if (n.getReferenceId() != null && (n.getType() == NotificationType.LIKE || n.getType() == NotificationType.COMMENT
                            || n.getType() == NotificationType.PROJECT_DEAD || n.getType() == NotificationType.PROJECT_LIVE)) {
                        postShareUrl = postRepo.findById(n.getReferenceId())
                                .map(com.arjun.hotdrop_backend.entity.Post::getShareUrl)
                                .orElse(null);
                    }
                    return NotificationResponseDto.builder()
                            .id(n.getId())
                            .senderHotdropId(n.getSender() != null ? n.getSender().getHotdropId() : "HotDrop")
                            .senderProfilePicture(n.getSender() != null ? n.getSender().getProfileImageUrl() : null)
                            .message(n.getMessage())
                            .type(n.getType())
                            .referenceId(n.getReferenceId())
                            .shareUrl(postShareUrl)
                            .isRead(n.isRead())
                            .createdAt(n.getCreatedAt())
                            .build();
                });

        log.info("Loaded {} notifications for user: {}", result.getNumberOfElements(), MaskUtils.maskIdentifier(hotdropId));
        return result;
    }

    @Override
    public long getUnreadCount(String hotdropId) {
        log.info("Getting unread notification count for user: {}", MaskUtils.maskIdentifier(hotdropId));

        User user = userRepo.findByHotdropId(hotdropId)
                .or(() -> userRepo.findByEmail(hotdropId))
                .orElseThrow(() -> {
                    log.warn("Cannot get unread count: user not found for {}", MaskUtils.maskIdentifier(hotdropId));
                    return new RuntimeException("User not found: " + hotdropId);
                });

        long count = notificationRepo.countByRecipientAndIsReadFalse(user);
        log.info("User {} has {} unread notifications.", MaskUtils.maskIdentifier(hotdropId), count);
        return count;
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, String hotdropId) {
        log.info("Marking notification {} as read for user: {}", notificationId, MaskUtils.maskIdentifier(hotdropId));

        Notification notification = notificationRepo.findById(notificationId)
                .orElseThrow(() -> {
                    log.warn("Cannot mark as read: notification {} was not found.", notificationId);
                    return new RuntimeException("Notification not found");
                });

        if (!notification.getRecipient().getHotdropId().equalsIgnoreCase(hotdropId) &&
            !notification.getRecipient().getEmail().equalsIgnoreCase(hotdropId)) {
            log.warn("User {} cannot mark notification {} of another user.", MaskUtils.maskIdentifier(hotdropId), notificationId);
            throw new RuntimeException("Unauthorized to modify this notification");
        }

        notification.setRead(true);
        notificationRepo.save(notification);
        log.info("Marked notification {} as read for user: {}", notificationId, MaskUtils.maskIdentifier(hotdropId));
    }

    @Override
    @Transactional
    public void markAllAsRead(String hotdropId) {
        log.info("Marking all notifications as read for user: {}", MaskUtils.maskIdentifier(hotdropId));

        User user = userRepo.findByHotdropId(hotdropId)
                .or(() -> userRepo.findByEmail(hotdropId))
                .orElseThrow(() -> {
                    log.warn("Cannot mark all as read: user not found for {}", MaskUtils.maskIdentifier(hotdropId));
                    return new RuntimeException("User not found: " + hotdropId);
                });

        org.springframework.data.domain.Page<Notification> page = notificationRepo.findByRecipientOrderByCreatedAtDesc(user, org.springframework.data.domain.Pageable.unpaged());
        java.util.List<Notification> unread = page.getContent().stream()
                .filter(n -> !n.isRead())
                .toList();

        unread.forEach(n -> n.setRead(true));
        notificationRepo.saveAll(unread);
        log.info("Marked {} notifications as read for user: {}", unread.size(), MaskUtils.maskIdentifier(hotdropId));
    }
}
