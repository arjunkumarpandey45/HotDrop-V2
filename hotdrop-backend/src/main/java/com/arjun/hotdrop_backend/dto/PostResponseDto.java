package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponseDto {
    @NotNull
    private UUID id;

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    @Size(max = 5000)
    private String description;

    @NotBlank
    @Size(max = 512)
    private String projectUrl;

    @NotBlank
    private String shareUrl;
    private boolean isLinkDead;
    private boolean isLiked;
    private int likeCount;
    private int commentCount;
    private int shareCount;
    private LocalDateTime createdAt;
    private List<String> tags;
    private List<String> imageUrls;

    private UserSummaryDto creator;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private UUID id;
        private String hotdropId;
       private String firstName;
        private String lastName;
        private String profilePicture;
    }
}