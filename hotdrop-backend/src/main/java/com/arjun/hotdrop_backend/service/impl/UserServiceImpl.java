package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.*;

import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.*;
import com.arjun.hotdrop_backend.service.CloudinaryService;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
    private final CloudinaryService cloudinary;
    private final PostRepo postRepo;
    private final UserRepo userRepo;
    private final FollowRepo followRepo;
    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private  final NotificationService notificationService;
    private final LikeRepo likeRepo;
    private final UserImageHistoryRepo userImageHistoryRepo;

    @Override
    @Cacheable(
            value = "publicUserProfiles",
            key = "{#hotdropId, #currentLoggedInHotdropId}",
            unless = "#result == null"
    )
    public UserResponseOnSearchDto getUserByHotDropId(String hotdropId, String currentLoggedInHotdropId) {
        log.info("Finding user profile: {}", hotdropId);

        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("User profile not found: {}", hotdropId);
                    return new RuntimeException("User profile not found with ID: " + hotdropId);
                });

        int postCount = postRepo.countByUser(currentUser);
        int followerCount = followRepo.countByFollowing(currentUser);
        int followingCount = followRepo.countByFollower(currentUser);

        boolean isOwner = currentLoggedInHotdropId != null && currentLoggedInHotdropId.equals(hotdropId);
        log.info("Found profile for user: {}", hotdropId);
        return UserResponseOnSearchDto.builder()
                .id(currentUser.getId())
                .firstName(currentUser.getFirstName())
                .lastName(currentUser.getLastName())
                .hotdropId(currentUser.getHotdropId())
                .email(currentUser.getEmail())
                .bio(currentUser.getBio())
                .portfolioUrl(currentUser.getPortfolioUrl())
                .profileImageUrl(currentUser.getProfileImageUrl())
                .linkedinUrl(currentUser.getLinkedinUrl())
                .githubUrl(currentUser.getGithubUrl())
                .leetcodeUrl(currentUser.getLeetcodeUrl())
                .postCount(postCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .isOwner(isOwner)
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = {"publicUserProfiles", "userFollowersList", "userFollowingList"}, allEntries = true)
    public FollowResponseDto toggleFollowUser(UUID userIdToFollow, String currentHotdropId) {
        log.info("User {} is following or unfollowing user: {}", currentHotdropId, userIdToFollow);

        User currentUser = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> {
                    log.error("User not found: {}", currentHotdropId);
                    return new RuntimeException("Authenticated user not found");
                });

        User targetUser = userRepo.findById(userIdToFollow)
                .orElseThrow(() -> {
                    log.error("Target user not found: {}", userIdToFollow);
                    return new RuntimeException("Target user not found");
                });

        if (currentUser.getId().equals(targetUser.getId())) {
            log.error("User {} cannot follow themselves", currentHotdropId);
            throw new RuntimeException("You cannot follow yourself");
        }

        Optional<Follow> existingFollow = followRepo.findByFollowerAndFollowing(currentUser, targetUser);
        boolean isFollowingNow;

        if (existingFollow.isPresent()) {
            followRepo.delete(existingFollow.get());
            isFollowingNow = false;
            log.info("User {} unfollowed user: {}", currentHotdropId, targetUser.getHotdropId());
        } else {
            Follow newFollow = Follow.builder()
                    .follower(currentUser)
                    .following(targetUser)
                    .build();
            followRepo.save(newFollow);
            isFollowingNow = true;
            notificationService.sendNotification(
                    currentUser,
                    targetUser,
                    NotificationType.FOLLOW,
                    " started following you.",
                    currentUser.getId()
            );
            log.info("User {} followed user: {}", currentHotdropId, targetUser.getHotdropId());
        }

        followRepo.flush();

        int totalFollowers = followRepo.countByFollowing(targetUser);

        return FollowResponseDto.builder()
                .isFollowing(isFollowingNow)
                .followerCount(totalFollowers)
                .hotdropId(targetUser.getHotdropId())
                .profilePicture(targetUser.getProfileImageUrl())
                .targetUserId(targetUser.getId())
                .build();
    }

    @Override
    public List<FollowerUserDto> getUserFollowers(UUID profileUserId, String currentHotdropId) {
        log.info("Getting followers for user: {}", profileUserId);

        User targetProfileUser = userRepo.findById(profileUserId)
                .orElseThrow(() -> {
                    log.error("Target user not found: {}", profileUserId);
                    return new RuntimeException("Profile user not found");
                });

        User currentUser = null;
        if (currentHotdropId != null && !currentHotdropId.isBlank()) {
            currentUser = userRepo.findByHotdropId(currentHotdropId).orElse(null);
        }

        List<Follow> followersList = followRepo.findByFollowing(targetProfileUser);
        final User loggedInUser = currentUser;

        List<FollowerUserDto> result = followersList.stream().map(follow -> {
            User followerUser = follow.getFollower();

            boolean isFollowingBack = false;
            if (loggedInUser != null) {
                isFollowingBack = followRepo.existsByFollowerAndFollowing(loggedInUser, followerUser);
            }

            return FollowerUserDto.builder()
                    .id(followerUser.getId())
                    .hotdropId(followerUser.getHotdropId())
                    .firstName(followerUser.getFirstName())
                    .lastName(followerUser.getLastName())
                    .profileImageUrl(followerUser.getProfileImageUrl())
                    .isFollowing(isFollowingBack)
                    .build();
        }).collect(Collectors.toList());

        log.info("Found {} followers for user: {}", result.size(), profileUserId);
        return result;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"publicUserProfiles", "userSearchTop5"}, allEntries = true)
    public UserResponseDto updateProfileDetails(
            UUID userIdFromParams,
            String currentHotdropId,
            ProfileUpdateRequestDto requestDto) {
        log.info("Updating profile for user: {}", currentHotdropId);

        String hotdropId = requestDto.getHotdropId();
        if (hotdropId != null && !hotdropId.matches("^[a-zA-Z0-9]+$")) {
            log.error("Hotdrop ID contains invalid characters: {}", hotdropId);
            throw new IllegalArgumentException("Hotdrop ID can only contain letters and numbers");
        }
        User currentUser = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> {
                    log.error("User not found: {}", currentHotdropId);
                    return new RuntimeException("Authenticated user session data not found");
                });

        if (userIdFromParams != null && !currentUser.getId().equals(userIdFromParams)) {
            log.error("User {} cannot edit profile of user: {}", currentHotdropId, userIdFromParams);
            throw new RuntimeException("Access Denied: You are not the owner of this profile");
        }

        if (requestDto.getHotdropId() != null && !requestDto.getHotdropId().isBlank()) {
            String newHotdropId = requestDto.getHotdropId().trim();
            if (!newHotdropId.equals(currentUser.getHotdropId())) {
                boolean isTaken = userRepo.existsByHotdropId(newHotdropId);
                if (isTaken) {
                    log.error("Hotdrop ID is already taken: {}", newHotdropId);
                    throw new RuntimeException("HotdropId is already taken");
                }
                currentUser.setHotdropId(newHotdropId);
            }
        }

        MultipartFile profilePicture = requestDto.getProfilePicture();

        if (profilePicture != null && !profilePicture.isEmpty()) {

            if (currentUser.getProfileImageUrl() != null && !currentUser.getProfileImageUrl().isBlank()) {
                try {
                    String existingPublicId = (currentUser.getProfileImagePublicId() != null)
                            ? currentUser.getProfileImagePublicId()
                            : extractPublicIdFromUrl(currentUser.getProfileImageUrl());

                    UserImageHistory historyRecord = UserImageHistory.builder()
                            .user(currentUser)
                            .imageUrl(currentUser.getProfileImageUrl())
                            .publicId(existingPublicId)
                            .changedAt(LocalDateTime.now())
                            .build();

                    userImageHistoryRepo.save(historyRecord);
                    log.info("Saved old profile picture for user: {}", currentUser.getHotdropId());
                } catch (Exception e) {
                    log.error("Could not save old profile picture: {}", e.getMessage());
                }
            }

            try {
                log.info("Uploading new profile picture for user: {}", currentUser.getHotdropId());
                Map<String, String> uploadResult = cloudinary.uploadImageForProfileImage(profilePicture);

                String newUploadedUrl = uploadResult.get("url");
                String newPublicId = uploadResult.get("publicId");

                if (newUploadedUrl == null || newPublicId == null) {
                    log.error("Profile picture upload failed because image details are missing");
                    throw new RuntimeException("Keys mismatch: Retrieved null values from CloudinaryService response map.");
                }

                currentUser.setProfileImageUrl(newUploadedUrl);
                currentUser.setProfileImagePublicId(newPublicId);
                log.info("Updated profile picture for user: {}", currentUser.getHotdropId());
            } catch (Exception e) {
                log.error("Failed to upload profile picture for user {}: {}", currentUser.getHotdropId(), e.getMessage());
                throw new RuntimeException("File upload sequence processing failed: " + e.getMessage());
            }
        }

        if (requestDto.getBio() != null) currentUser.setBio(requestDto.getBio().trim());
        if (requestDto.getFirstName() != null) currentUser.setFirstName(requestDto.getFirstName().trim());
        if (requestDto.getLastName() != null) currentUser.setLastName(requestDto.getLastName().trim());
        if (requestDto.getGithubUrl() != null) currentUser.setGithubUrl(requestDto.getGithubUrl().trim());
        if (requestDto.getLinkedinUrl() != null) currentUser.setLinkedinUrl(requestDto.getLinkedinUrl().trim());
        if (requestDto.getLeetcodeUrl() != null) currentUser.setLeetcodeUrl(requestDto.getLeetcodeUrl().trim());
        if (requestDto.getPortfolioUrl() != null) currentUser.setPortfolioUrl(requestDto.getPortfolioUrl().trim());

        User updatedUser = userRepo.saveAndFlush(currentUser);
        log.info("Updated profile for user: {}", updatedUser.getHotdropId());

        return userMapper.toResponseDto(updatedUser);
    }

    @Override
    @Transactional
    public MeResponseDto getMeByHotdropId(String hotdropId) {
        log.info("Getting profile details for user: {}", hotdropId);

        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", hotdropId);
                    return new RuntimeException("User not found with email: " + hotdropId);
                });

        return getMe(user.getId());
    }

    @Override
    @Transactional
    public MeResponseDto getMe(UUID userId) {
        log.info("Getting account details for user: {}", userId);

        User user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new RuntimeException("User not found with ID: " + userId);
                });

        List<Post> userPosts = postRepo.findByUserIdOrderByCreatedAtDesc(userId);
        int followerCount = followRepo.countByFollowing(user);
        int followingCount = followRepo.countByFollower(user);
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .collect(Collectors.toSet());

        UserResponseDto userDto = UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .hotdropId(user.getHotdropId())
                .email(user.getEmail())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .profileImagePublicId(user.getProfileImagePublicId())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .leetcodeUrl(user.getLeetcodeUrl())
                .portfolioUrl(user.getPortfolioUrl())
                .emailVerified(user.isEmailVerified())
                .postCount(userPosts.size())
                .followerCount(followerCount)
                .followingCount(followingCount)
                .createdAt(user.getCreatedAt())
                .roles(roleNames)
                .build();

        List<PostResponseDto> postDtos = userPosts.stream().map(post -> {

            List<String> imageUrls = post.getImages().stream()
                    .map(PostImage::getUrl)
                    .collect(Collectors.toList());
            boolean isLiked = likeRepo.existsByUserIdAndPostId(user.getId(), post.getId());

            PostResponseDto.UserSummaryDto creator = PostResponseDto.UserSummaryDto.builder()
                    .id(user.getId())
                    .hotdropId(user.getHotdropId())
                    .profilePicture(user.getProfileImageUrl())
                    .build();

            return PostResponseDto.builder()
                .id(post.getId())
                    .title(post.getTitle())
                    .description(post.getDescription())
                    .projectUrl(post.getProjectUrl())
                    .shareUrl(post.getShareUrl())
                    .isLinkDead(post.isLinkDead())
                    .isLiked(isLiked)
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .shareCount(post.getShareCount())
                    .createdAt(post.getCreatedAt())
                    .tags(post.getTags())
                    .imageUrls(imageUrls)
                    .creator(creator)
                    .build();
        }).toList();

        log.info("Loaded account details for user {} with {} posts", user.getHotdropId(), postDtos.size());

        return MeResponseDto.builder()
                .user(userDto)
                .posts(postDtos)
                .build();
    }

    private String extractPublicIdFromUrl(String url) {
        try {
            if (url == null || !url.contains("upload/")) return null;
            String afterUpload = url.split("upload/")[1];
            if (afterUpload.contains("/")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }
            return afterUpload.substring(0, afterUpload.lastIndexOf("."));
        } catch (Exception e) {
            log.warn("Could not read image id from url: {}", url);
            return null;
        }
    }

    @Override
    @Cacheable(value = "userFollowersList", key = "#userId", unless = "#result == null")
    public List<UserResponseDto> getFollowersList(UUID userId) {
        log.info("Getting followers for user: {}", userId);

        User targetUser = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new RuntimeException("User not found");
                });

        List<Follow> follows = followRepo.findAllByFollowing(targetUser);
        log.info("Found {} followers for user: {}", follows.size(), targetUser.getHotdropId());

        return follows.stream()
                .map(follow -> userMapper.toBasicResponseDto(follow.getFollower()))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "userFollowingList", key = "#userId", unless = "#result == null")
    public List<UserResponseDto> getFollowingList(UUID userId) {
        log.info("Getting accounts followed by user: {}", userId);

        User currentUser = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new RuntimeException("User not found");
                });

        List<Follow> follows = followRepo.findAllByFollower(currentUser);
        log.info("Found {} accounts followed by user: {}", follows.size(), currentUser.getHotdropId());

        return follows.stream()
                .map(follow -> userMapper.toBasicResponseDto(follow.getFollowing()))
                .collect(Collectors.toList());
    }
    @Cacheable(
            value = "userSearchTop5",
            key = "#query.toLowerCase().trim()",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<PostResponseDto.UserSummaryDto> searchTop5Users(String query) {
        log.info("Searching users matching: {}", query);

        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        String cleanQuery = query.trim();
        List<User> users = userRepo.findTop5ByHotdropIdContainingIgnoreCaseOrFirstNameContainingIgnoreCase(cleanQuery, cleanQuery);
        log.info("Found {} users matching: {}", users.size(), cleanQuery);

        return users.stream()
                .map(user -> PostResponseDto.UserSummaryDto.builder()
                        .id(user.getId())
                        .hotdropId(user.getHotdropId())
                        .profilePicture(user.getProfileImageUrl())
                        .firstName(user.getFirstName()) 
                        .lastName(user.getLastName())
                        .build())
                .toList();
    }
}
