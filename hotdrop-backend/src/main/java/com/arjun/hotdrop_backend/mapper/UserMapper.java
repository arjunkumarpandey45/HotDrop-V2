package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserResponseDto toResponseDto(User user) {
        if (user == null) {
            return null;
        }


        Set<String> assignedRoles = new HashSet<>();
        if (user.getRoles() != null) {
            assignedRoles = user.getRoles().stream()
                    .map(role -> role.getRoleName().name())
                    .collect(Collectors.toSet());
        }

        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .hotdropId(user.getHotdropId())
                .email(user.getEmail())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .leetcodeUrl(user.getLeetcodeUrl())
                .portfolioUrl(user.getPortfolioUrl())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .roles(assignedRoles)
                .build();
    }
}