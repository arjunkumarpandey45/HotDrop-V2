package com.arjun.hotdrop_backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private UUID id;
    private String firstName;
    private String lastName;
    private String hotdropId;
    private String email;
    private String bio;
    private String profileImageUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String leetcodeUrl;
    private String portfolioUrl;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private Set<String> roles;
}