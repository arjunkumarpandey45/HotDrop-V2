package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.NotificationResponseDto;
import com.arjun.hotdrop_backend.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponseDto toResponseDto(Notification notification, String postShareUrl) {
        if (notification == null) return null;
        
        return NotificationResponseDto.builder()
                .id(notification.getId())
                .senderHotdropId(notification.getSender() != null ? notification.getSender().getHotdropId() : "HotDrop")
                .senderProfilePicture(notification.getSender() != null ? notification.getSender().getProfileImageUrl() : null)
                .message(notification.getMessage())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .shareUrl(postShareUrl)
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
