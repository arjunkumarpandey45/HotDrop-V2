package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
    @NotBlank(message = "Hotdrop ID is required")
    @Size(min = 5, message = "Hotdrop ID must be at least 5 characters long")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Hotdrop ID can only contain letters and numbers")
    private String hotdropId;
    private String email;
    private String bio;
    private String profileImageUrl;
    private  String profileImagePublicId;
    private String githubUrl;
    private String linkedinUrl;
    private String leetcodeUrl;
    private String portfolioUrl;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private Set<String> roles;
    private int postCount;
    private int followingCount;
    private int followerCount;
}