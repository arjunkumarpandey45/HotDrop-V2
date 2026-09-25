package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.dto.UserResponseOnSearchDto;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.FollowRepo;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.dto.FollowResponseDto;
import com.arjun.hotdrop_backend.dto.FollowerUserDto;
import com.arjun.hotdrop_backend.dto.MeResponseDto;
import com.arjun.hotdrop_backend.dto.PostResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserMapper {

    public UserResponseDto toResponseDto(User user, int postCount, int followerCount, int followingCount) {
        if (user == null) return null;

        return baseBuilder(user)
                .email(user.getEmail())
                .bio(user.getBio())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .leetcodeUrl(user.getLeetcodeUrl())
                .portfolioUrl(user.getPortfolioUrl())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .postCount(postCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .build();
    }


    public UserResponseDto toBasicResponseDto(User user) {
        return user == null ? null : baseBuilder(user).build();
    }


    public UserResponseOnSearchDto toSearchResponseDto(User user, boolean isOwner, int postCount, int followerCount, int followingCount) {
        if (user == null) return null;

        return UserResponseOnSearchDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .hotdropId(user.getHotdropId())
                .email(user.getEmail())
                .bio(user.getBio())
                .portfolioUrl(user.getPortfolioUrl())
                .profileImageUrl(user.getProfileImageUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .leetcodeUrl(user.getLeetcodeUrl())
                .postCount(postCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .isOwner(isOwner)
                .build();
    }

    public FollowResponseDto toFollowResponseDto(boolean isFollowingNow, int totalFollowers, User targetUser) {
        if (targetUser == null) return null;
        return FollowResponseDto.builder()
                .isFollowing(isFollowingNow)
                .followerCount(totalFollowers)
                .hotdropId(targetUser.getHotdropId())
                .profilePicture(targetUser.getProfileImageUrl())
                .targetUserId(targetUser.getId())
                .build();
    }

    public FollowerUserDto toFollowerUserDto(User followerUser, boolean isFollowing) {
        if (followerUser == null) return null;
        
        return FollowerUserDto.builder()
                .id(followerUser.getId())
                .hotdropId(followerUser.getHotdropId())
                .firstName(followerUser.getFirstName())
                .lastName(followerUser.getLastName())
                .profileImageUrl(followerUser.getProfileImageUrl())
                .isFollowing(isFollowing)
                .build();
    }

    public MeResponseDto toMeResponseDto(UserResponseDto userDto, List<PostResponseDto> postDtos) {
        return MeResponseDto.builder()
                .user(userDto)
                .posts(postDtos == null ? Collections.emptyList() : postDtos)
                .build();
    }

    private UserResponseDto.UserResponseDtoBuilder baseBuilder(User user) {
        Set<String> roles = (user.getRoles() == null) ? Collections.emptySet() :
                user.getRoles().stream()
                        .map(role -> role.getRoleName().name())
                        .collect(Collectors.toSet());

        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .hotdropId(user.getHotdropId())
                .profileImageUrl(user.getProfileImageUrl())
                .roles(roles);
    }
}