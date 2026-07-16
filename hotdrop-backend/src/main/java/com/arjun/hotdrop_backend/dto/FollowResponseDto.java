package com.arjun.hotdrop_backend.dto;


import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponseDto {
    private boolean isFollowing;
    private int followerCount;
    private String hotdropId;
    private String profilePicture;
    private UUID targetUserId;
}