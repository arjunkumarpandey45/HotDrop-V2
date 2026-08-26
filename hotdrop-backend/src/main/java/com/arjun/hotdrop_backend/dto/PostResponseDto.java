package com.arjun.hotdrop_backend.dto;

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
    private UUID id;
    private String title;
    private String description;
    private String projectUrl;
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