package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.NotificationResponseDto;
import com.arjun.hotdrop_backend.entity.Notification;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.repository.NotificationRepo;
import com.arjun.hotdrop_backend.service.NotificationService;
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

        if (sender.getId().equals(recipient.getId())) {
            return;
        }

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
        if (referenceId != null && (type == NotificationType.LIKE || type == NotificationType.COMMENT)) {
            postShareUrl = postRepo.findById(referenceId)
                    .map(Post::getShareUrl)
                    .orElse(null);
        }

        NotificationResponseDto payload = NotificationResponseDto.builder()
                .id(saved.getId())
                .senderHotdropId(sender.getHotdropId())
                .senderProfilePicture(sender.getProfileImageUrl())
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

        log.info("Real-time notification dispatched to @{}", recipient.getHotdropId());
    }

    @Override
    public org.springframework.data.domain.Page<NotificationResponseDto> getUserNotifications(String hotdropId, org.springframework.data.domain.Pageable pageable) {
        User user = userRepo.findByHotdropId(hotdropId)
                .or(() -> userRepo.findByEmail(hotdropId))
                .orElseThrow(() -> new RuntimeException("User not found: " + hotdropId));

        return notificationRepo.findByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(n -> {
                    String postShareUrl = null;
                    if (n.getReferenceId() != null && (n.getType() == NotificationType.LIKE || n.getType() == NotificationType.COMMENT)) {
                        postShareUrl = postRepo.findById(n.getReferenceId())
                                .map(com.arjun.hotdrop_backend.entity.Post::getShareUrl)
                                .orElse(null);
                    }
                    return NotificationResponseDto.builder()
                            .id(n.getId())
                            .senderHotdropId(n.getSender().getHotdropId())
                            .senderProfilePicture(n.getSender().getProfileImageUrl())
                            .message(n.getMessage())
                            .type(n.getType())
                            .referenceId(n.getReferenceId())
                            .shareUrl(postShareUrl)
                            .isRead(n.isRead())
                            .createdAt(n.getCreatedAt())
                            .build();
                });
    }

    @Override
    public long getUnreadCount(String hotdropId) {
        User user = userRepo.findByHotdropId(hotdropId)
                .or(() -> userRepo.findByEmail(hotdropId))
                .orElseThrow(() -> new RuntimeException("User not found: " + hotdropId));
        return notificationRepo.countByRecipientAndIsReadFalse(user);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, String hotdropId) {
        Notification notification = notificationRepo.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getHotdropId().equalsIgnoreCase(hotdropId) &&
            !notification.getRecipient().getEmail().equalsIgnoreCase(hotdropId)) {
            throw new RuntimeException("Unauthorized to modify this notification");
        }
        notification.setRead(true);
        notificationRepo.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String hotdropId) {
        User user = userRepo.findByHotdropId(hotdropId)
                .or(() -> userRepo.findByEmail(hotdropId))
                .orElseThrow(() -> new RuntimeException("User not found: " + hotdropId));

        org.springframework.data.domain.Page<Notification> page = notificationRepo.findByRecipientOrderByCreatedAtDesc(user, org.springframework.data.domain.Pageable.unpaged());
        java.util.List<Notification> unread = page.getContent().stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepo.saveAll(unread);
    }
}
