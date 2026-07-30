package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.FollowRepo;
import com.arjun.hotdrop_backend.repository.PostRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final PostRepo postRepo;
    private final FollowRepo followRepo;

    // 1. Full Profile DTO (Includes Counts) - Main Profile Page Ke Liye
    public UserResponseDto toResponseDto(User user) {
        if (user == null) {
            return null;
        }

        Set<String> assignedRoles = extractRoles(user);

        int followerCount = followRepo.countByFollowing(user);
        int followingCount = followRepo.countByFollower(user);
        int postCount = postRepo.countByUser(user);

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
                .postCount(postCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .build();
    }

    // 2. Lightweight DTO - Followers/Following Modals & Lists Ke Liye
    public UserResponseDto toBasicResponseDto(User user) {
        if (user == null) {
            return null;
        }

        Set<String> assignedRoles = extractRoles(user);

        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .hotdropId(user.getHotdropId())
                .profileImageUrl(user.getProfileImageUrl())
                .roles(assignedRoles)
                .build();
    }

    private Set<String> extractRoles(User user) {
        if (user.getRoles() == null) return new HashSet<>();
        return user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .collect(Collectors.toSet());
    }
}