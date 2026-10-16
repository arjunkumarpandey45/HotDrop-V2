package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.NotificationResponseDto;
import com.arjun.hotdrop_backend.entity.Notification;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.mapper.NotificationMapper;
import com.arjun.hotdrop_backend.repository.NotificationRepo;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepo notificationRepo;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private UserRepo userRepo;

    @Mock
    private PostRepo postRepo;

    @Mock
    private NotificationMapper notificationMapper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User senderUser;
    private User recipientUser;
    private UUID samplePostId;

    @BeforeEach
    void setUp() {
        senderUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("sender_dev")
                .email("sender@hotdrop.io")
                .build();

        recipientUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("recipient_dev")
                .email("recipient@hotdrop.io")
                .build();

        samplePostId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("sendNotification Tests")
    class SendNotificationTests {

        @Test
        @DisplayName("Should skip sending notification when sender and recipient are identical (for like/comment/follow)")
        void sendNotification_SameUser_SkipsNotification() {
            notificationService.sendNotification(
                    recipientUser,
                    recipientUser,
                    NotificationType.LIKE,
                    "liked your post",
                    samplePostId
            );

            verifyNoInteractions(notificationRepo);
            verifyNoInteractions(messagingTemplate);
        }

        @Test
        @DisplayName("Should send notification when sender and recipient are identical for PROJECT_DEAD type")
        void sendNotification_SameUser_ProjectDead_SendsNotification() {
            Post post = Post.builder().id(samplePostId).shareUrl("project-slug-123").build();
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(post));
            when(notificationRepo.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            NotificationResponseDto mockDto = NotificationResponseDto.builder().build();
            when(notificationMapper.toResponseDto(any(Notification.class), eq("project-slug-123"))).thenReturn(mockDto);

            notificationService.sendNotification(
                    recipientUser,
                    recipientUser,
                    NotificationType.PROJECT_DEAD,
                    "Alert: Project is down",
                    samplePostId
            );

            verify(notificationRepo).save(any(Notification.class));
            verify(messagingTemplate).convertAndSendToUser(
                    eq("recipient_dev"),
                    eq("/queue/notifications"),
                    eq(mockDto)
            );
        }

        @Test
        @DisplayName("Should successfully send notification to different recipient with post shareUrl resolved")
        void sendNotification_DifferentUsers_Success() {
            Post post = Post.builder().id(samplePostId).shareUrl("cool-app-slug").build();
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(post));
            when(notificationRepo.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            NotificationResponseDto mockDto = NotificationResponseDto.builder().build();
            when(notificationMapper.toResponseDto(any(Notification.class), eq("cool-app-slug"))).thenReturn(mockDto);

            notificationService.sendNotification(
                    senderUser,
                    recipientUser,
                    NotificationType.COMMENT,
                    "Awesome work!",
                    samplePostId
            );

            verify(notificationRepo).save(any(Notification.class));
            verify(messagingTemplate).convertAndSendToUser(
                    eq("recipient_dev"),
                    eq("/queue/notifications"),
                    eq(mockDto)
            );
        }
    }

    @Nested
    @DisplayName("getUserNotifications Tests")
    class GetUserNotificationsTests {

        @Test
        @DisplayName("Should retrieve paged notifications mapped to response DTOs")
        void getUserNotifications_Success() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepo.findByHotdropId("recipient_dev")).thenReturn(Optional.of(recipientUser));

            Notification notification = Notification.builder()
                    .id(UUID.randomUUID())
                    .recipient(recipientUser)
                    .type(NotificationType.LIKE)
                    .referenceId(samplePostId)
                    .message("liked your post")
                    .build();
            Page<Notification> notificationPage = new PageImpl<>(List.of(notification));
            when(notificationRepo.findByRecipientOrderByCreatedAtDesc(recipientUser, pageable))
                    .thenReturn(notificationPage);

            Post post = Post.builder().id(samplePostId).shareUrl("post-slug").build();
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(post));

            NotificationResponseDto mockDto = NotificationResponseDto.builder().build();
            when(notificationMapper.toResponseDto(notification, "post-slug")).thenReturn(mockDto);

            Page<NotificationResponseDto> result = notificationService.getUserNotifications("recipient_dev", pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should throw RuntimeException when user is not found")
        void getUserNotifications_UserNotFound_ThrowsException() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());
            when(userRepo.findByEmail("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.getUserNotifications("unknown_dev", pageable))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found: unknown_dev");
        }
    }

    @Nested
    @DisplayName("getUnreadCount Tests")
    class GetUnreadCountTests {

        @Test
        @DisplayName("Should return count of unread notifications for valid user")
        void getUnreadCount_Success() {
            when(userRepo.findByHotdropId("recipient_dev")).thenReturn(Optional.of(recipientUser));
            when(notificationRepo.countByRecipientAndIsReadFalse(recipientUser)).thenReturn(5L);

            long count = notificationService.getUnreadCount("recipient_dev");

            assertThat(count).isEqualTo(5L);
        }

        @Test
        @DisplayName("Should throw RuntimeException when user not found")
        void getUnreadCount_UserNotFound_ThrowsException() {
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());
            when(userRepo.findByEmail("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.getUnreadCount("unknown_dev"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found: unknown_dev");
        }
    }

    @Nested
    @DisplayName("markAsRead Tests")
    class MarkAsReadTests {

        @Test
        @DisplayName("Should mark notification as read when requested by recipient")
        void markAsRead_Success() {
            UUID notificationId = UUID.randomUUID();
            Notification notification = Notification.builder()
                    .id(notificationId)
                    .recipient(recipientUser)
                    .isRead(false)
                    .build();
            when(notificationRepo.findById(notificationId)).thenReturn(Optional.of(notification));

            notificationService.markAsRead(notificationId, "recipient_dev");

            assertThat(notification.isRead()).isTrue();
            verify(notificationRepo).save(notification);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when notification does not exist")
        void markAsRead_NotificationNotFound_ThrowsException() {
            UUID notificationId = UUID.randomUUID();
            when(notificationRepo.findById(notificationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markAsRead(notificationId, "recipient_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Notification not found");

            verify(notificationRepo, never()).save(any(Notification.class));
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when another user attempts to mark notification as read")
        void markAsRead_UnauthorizedUser_ThrowsException() {
            UUID notificationId = UUID.randomUUID();
            Notification notification = Notification.builder()
                    .id(notificationId)
                    .recipient(recipientUser)
                    .isRead(false)
                    .build();
            when(notificationRepo.findById(notificationId)).thenReturn(Optional.of(notification));

            assertThatThrownBy(() -> notificationService.markAsRead(notificationId, "intruder_dev"))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Unauthorized to modify this notification");

            verify(notificationRepo, never()).save(any(Notification.class));
        }
    }

    @Nested
    @DisplayName("markAllAsRead Tests")
    class MarkAllAsReadTests {

        @Test
        @DisplayName("Should mark all unread notifications as read for recipient")
        void markAllAsRead_Success() {
            when(userRepo.findByHotdropId("recipient_dev")).thenReturn(Optional.of(recipientUser));

            Notification n1 = Notification.builder().id(UUID.randomUUID()).recipient(recipientUser).isRead(false).build();
            Notification n2 = Notification.builder().id(UUID.randomUUID()).recipient(recipientUser).isRead(true).build();
            Page<Notification> notificationPage = new PageImpl<>(List.of(n1, n2));

            when(notificationRepo.findByRecipientOrderByCreatedAtDesc(eq(recipientUser), any(Pageable.class)))
                    .thenReturn(notificationPage);

            notificationService.markAllAsRead("recipient_dev");

            assertThat(n1.isRead()).isTrue();
            ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
            verify(notificationRepo).saveAll(captor.capture());
            assertThat(captor.getValue()).containsExactly(n1);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user does not exist")
        void markAllAsRead_UserNotFound_ThrowsException() {
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());
            when(userRepo.findByEmail("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markAllAsRead("unknown_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found: unknown_dev");

            verify(notificationRepo, never()).saveAll(anyList());
        }
    }
}
