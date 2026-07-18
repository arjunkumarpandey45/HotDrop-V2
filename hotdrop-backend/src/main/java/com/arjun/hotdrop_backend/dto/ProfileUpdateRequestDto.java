package com.arjun.hotdrop_backend.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequestDto {
    private String bio;
    private String firstName;
    private String lastName;
    private String hotdropId;
    private String githubUrl;
    private String linkedinUrl;
    private String leetcodeUrl;
    private String portfolioUrl;

    // --- BINDING FILE INSIDE THE DTO ---
    private MultipartFile profilePicture;
}