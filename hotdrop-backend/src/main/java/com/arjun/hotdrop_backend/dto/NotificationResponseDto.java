package com.arjun.hotdrop_backend.dto;

import com.arjun.hotdrop_backend.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponseDto {
    private UUID id;
    private String senderHotdropId;
    private String senderProfilePicture;
    private String message;
    private NotificationType type;
    private UUID referenceId;
    private String shareUrl;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
