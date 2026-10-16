package com.arjun.hotdrop_backend.scheduler;

import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.service.EmailService;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.utils.UserAgentProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LinkTrackingSchedulerTest {

    @Mock
    private UserAgentProvider userAgentProvider;

    @Mock
    private PostRepo postRepo;

    @Mock
    private TransactionTemplate transactionTemplate;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private LinkTrackingScheduler linkTrackingScheduler;

    @BeforeEach
    void setUp() {
        lenient().when(userAgentProvider.getRandomUserAgent()).thenReturn("Mozilla/5.0");

        lenient().when(transactionTemplate.execute(any())).thenAnswer(inv -> {
            TransactionCallback<?> callback = inv.getArgument(0);
            return callback.doInTransaction(mock(TransactionStatus.class));
        });

        lenient().doAnswer(inv -> {
            Consumer<TransactionStatus> action = inv.getArgument(0);
            action.accept(mock(TransactionStatus.class));
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    @Test
    @DisplayName("Should return early without processing when no active links exist")
    void startLiveTracking_NoActiveLinks_ReturnsEarly() {
        when(postRepo.findAllWithActiveProjectLinks()).thenReturn(Collections.emptyList());

        linkTrackingScheduler.startLiveTracking();

        verify(postRepo, never()).saveAll(anyList());
        verifyNoInteractions(notificationService);
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Should detect unreachable link, mark isLinkDead=true, and send project down alert")
    void startLiveTracking_LinkDown_SendsAlert() {
        User user = User.builder().id(UUID.randomUUID()).email("owner@hotdrop.io").build();
        Post post = Post.builder()
                .id(UUID.randomUUID())
                .title("My App")
                .projectUrl("https://unreachable-mock-domain-999.xyz")
                .isLinkDead(false) // previously alive
                .user(user)
                .build();

        when(postRepo.findAllWithActiveProjectLinks()).thenReturn(List.of(post));

        linkTrackingScheduler.startLiveTracking();

        assertThat(post.isLinkDead()).isTrue();
        assertThat(post.getLastChecked()).isNotNull();

        verify(notificationService).sendNotification(
                eq(user),
                eq(user),
                eq(NotificationType.PROJECT_DEAD),
                contains("unreachable"),
                eq(post.getId())
        );
        verify(emailService).sendProjectDownAlert("owner@hotdrop.io", "My App", "https://unreachable-mock-domain-999.xyz");
        verify(postRepo).saveAll(anyList());
    }
}
