package com.arjun.hotdrop_backend.dto;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
@NoArgsConstructor
public class UserResponseOnSearchDto {
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
    private List<PostResponseDto> posts;
}
