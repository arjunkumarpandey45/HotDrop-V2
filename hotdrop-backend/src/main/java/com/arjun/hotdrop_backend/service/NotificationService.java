package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.NotificationType;

import java.util.UUID;

public interface NotificationService {
    void sendNotification(User sender, User recipient, NotificationType type, String message, UUID referenceId);
    org.springframework.data.domain.Page<com.arjun.hotdrop_backend.dto.NotificationResponseDto> getUserNotifications(String hotdropId, org.springframework.data.domain.Pageable pageable);
    long getUnreadCount(String hotdropId);
    void markAsRead(UUID notificationId, String hotdropId);
    void markAllAsRead(String hotdropId);
}
