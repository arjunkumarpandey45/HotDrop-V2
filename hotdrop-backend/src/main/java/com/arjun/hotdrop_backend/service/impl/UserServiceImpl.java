package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.*;

import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.repository.*;
import com.arjun.hotdrop_backend.service.CloudinaryService;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.service.UserService;
import com.arjun.hotdrop_backend.utils.MaskUtils;
import com.arjun.hotdrop_backend.utils.RedisEvictionHelper;
import org.springframework.security.access.AccessDeniedException;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final NotificationService notificationService;
    private final LikeRepo likeRepo;
    private final UserImageHistoryRepo userImageHistoryRepo;
    private final RedisEvictionHelper redisEvictionHelper;

    @Override
    @Cacheable(
            value = "publicUserProfiles",
            key = "'user:' + #hotdropId.toLowerCase().trim() + ':viewer:' + (#currentLoggedInHotdropId != null ? #currentLoggedInHotdropId.toLowerCase().trim() : 'guest')",
            unless = "#result == null"
    )
    public UserResponseOnSearchDto getUserByHotDropId(String hotdropId, String currentLoggedInHotdropId) {
        log.info("Finding user profile: {}", MaskUtils.maskIdentifier(hotdropId));

        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.warn("User profile not found: {}", MaskUtils.maskIdentifier(hotdropId));
                    return new ResourceNotFoundException("User profile not found with ID: " + hotdropId);
                });



        boolean isOwner = currentLoggedInHotdropId != null && currentLoggedInHotdropId.equals(hotdropId);
        log.info("Found profile for user: {}", MaskUtils.maskIdentifier(hotdropId));
        int postCount = postRepo.countByUser(currentUser);
        int followerCount = followRepo.countByFollowing(currentUser);
        int followingCount = followRepo.countByFollower(currentUser);
        return userMapper.toSearchResponseDto(currentUser, isOwner, postCount, followerCount, followingCount);
    }

    @Override
    @Transactional
    public FollowResponseDto toggleFollowUser(UUID userIdToFollow, String currentHotdropId) {
        log.info("User {} is following or unfollowing user: {}", MaskUtils.maskIdentifier(currentHotdropId), userIdToFollow);

        User currentUser = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", MaskUtils.maskIdentifier(currentHotdropId));
                    return new AccessDeniedException("Authenticated user not found");
                });

        User targetUser = userRepo.findById(userIdToFollow)
                .orElseThrow(() -> {
                    log.warn("Target user not found: {}", userIdToFollow);
                    return new ResourceNotFoundException("Target user not found");
                });

        if (currentUser.getId().equals(targetUser.getId())) {
            log.warn("User {} cannot follow themselves", MaskUtils.maskIdentifier(currentHotdropId));
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        Optional<Follow> existingFollow = followRepo.findByFollowerAndFollowing(currentUser, targetUser);
        boolean isFollowingNow;

        if (existingFollow.isPresent()) {
            followRepo.delete(existingFollow.get());
            isFollowingNow = false;
            log.info("User {} unfollowed user: {}", MaskUtils.maskIdentifier(currentHotdropId), MaskUtils.maskIdentifier(targetUser.getHotdropId()));
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
            log.info("User {} followed user: {}", MaskUtils.maskIdentifier(currentHotdropId), MaskUtils.maskIdentifier(targetUser.getHotdropId()));
        }

        followRepo.flush();

        int totalFollowers = followRepo.countByFollowing(targetUser);

                redisEvictionHelper.evictCacheEntriesByPrefix("publicUserProfiles", "user:" + targetUser.getHotdropId().toLowerCase().trim());
        redisEvictionHelper.evictCacheEntriesByPrefix("publicUserProfiles", "user:" + currentUser.getHotdropId().toLowerCase().trim());
        
        redisEvictionHelper.evictCacheEntriesByPrefix("userFollowersPaged", "user:" + targetUser.getId().toString() + ":viewer:");
        redisEvictionHelper.evictCacheEntriesByPrefix("userFollowingPaged", "user:" + targetUser.getId().toString() + ":viewer:");
        redisEvictionHelper.evictCacheEntriesByPrefix("userFollowersPaged", "user:" + currentUser.getId().toString() + ":viewer:");
        redisEvictionHelper.evictCacheEntriesByPrefix("userFollowingPaged", "user:" + currentUser.getId().toString() + ":viewer:");

        return userMapper.toFollowResponseDto(isFollowingNow, totalFollowers, targetUser);
    }

    @Override
    @Cacheable(
            value = "userFollowersPaged",
            key = "'user:' + #profileUserId.toString() + ':viewer:' + (#currentHotdropId != null ? #currentHotdropId : 'guest') + ':page:' + #page + ':size:' + #size",
            unless = "#result == null"
    )
    public PagedResponse<FollowerUserDto> getUserFollowers(UUID profileUserId, String currentHotdropId, int page, int size) {
        log.info("Getting followers for user: {}, page: {}, size: {}", profileUserId, page, size);

        User targetProfileUser = userRepo.findById(profileUserId)
                .orElseThrow(() -> {
                    log.warn("Target user not found: {}", profileUserId);
                    return new ResourceNotFoundException("Profile user not found");
                });

        User currentUser = null;
        if (currentHotdropId != null && !currentHotdropId.isBlank()) {
            currentUser = userRepo.findByHotdropId(currentHotdropId).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Follow> followPage = followRepo.findByFollowing(targetProfileUser, pageable);
        final User loggedInUser = currentUser;

        List<FollowerUserDto> result = followPage.getContent().stream().map(follow -> {
            User followerUser = follow.getFollower();

            boolean isFollowingBack = false;
            if (loggedInUser != null) {
                isFollowingBack = followRepo.existsByFollowerAndFollowing(loggedInUser, followerUser);
            }

            return userMapper.toFollowerUserDto(followerUser, isFollowingBack);
        }).toList();

        log.info("Found {} followers for user: {}", result.size(), profileUserId);
        return PagedResponse.from(followPage, result);
    }
    @Override

    @Cacheable(value = "userFollowingPaged", key = "'user:' + #userId.toString() + ':viewer:' + (#currentHotdropId != null ? #currentHotdropId : 'guest') + ':page:' + #page + ':size:' + #size", unless = "#result == null")
    public PagedResponse<FollowerUserDto> getFollowingList(UUID userId, String currentHotdropId, int page, int size) {
        log.info("Getting accounts followed by user: {}, viewer: {}, page: {}, size: {}", userId, currentHotdropId, page, size);

        User profileUser = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        User loggedInUser = null;
        if (currentHotdropId != null && !currentHotdropId.equalsIgnoreCase("guest")) {
            loggedInUser = userRepo.findByHotdropId(currentHotdropId).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Follow> followPage = followRepo.findByFollower(profileUser, pageable);
        
        final User finalLoggedInUser = loggedInUser;
        List<FollowerUserDto> result = followPage.getContent().stream().map(follow -> {
            User followingUser = follow.getFollowing();
            boolean isFollowing = false;
            if (finalLoggedInUser != null) {
                isFollowing = followRepo.existsByFollowerAndFollowing(finalLoggedInUser, followingUser);
            }
            return userMapper.toFollowerUserDto(followingUser, isFollowing);
        }).toList();

        return PagedResponse.from(followPage, result);
    }

    @Override
    @Transactional
    public UserResponseDto updateProfileDetails(
            UUID userIdFromParams,
            String currentHotdropId,
            ProfileUpdateRequestDto requestDto) {
        log.info("Updating profile for user: {}", MaskUtils.maskIdentifier(currentHotdropId));

        String hotdropId = requestDto.getHotdropId();
        if (hotdropId != null && !hotdropId.matches("^[a-zA-Z0-9]+$")) {
            log.warn("Hotdrop ID contains invalid characters: {}", MaskUtils.maskIdentifier(hotdropId));
            throw new IllegalArgumentException("Hotdrop ID can only contain letters and numbers");
        }
        User currentUser = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", MaskUtils.maskIdentifier(currentHotdropId));
                    return new AccessDeniedException("Authenticated user session data not found");
                });

        if (userIdFromParams != null && !currentUser.getId().equals(userIdFromParams)) {
            log.warn("User {} cannot edit profile of user: {}", MaskUtils.maskIdentifier(currentHotdropId), userIdFromParams);
            throw new AccessDeniedException("Access Denied: You are not the owner of this profile");
        }

        String oldHotdropId = currentUser.getHotdropId();

        if (requestDto.getHotdropId() != null && !requestDto.getHotdropId().isBlank()) {
            String newHotdropId = requestDto.getHotdropId().trim();
            if (!newHotdropId.equals(currentUser.getHotdropId())) {
                boolean isTaken = userRepo.existsByHotdropId(newHotdropId);
                if (isTaken) {
                    log.warn("Hotdrop ID is already taken: {}", MaskUtils.maskIdentifier(newHotdropId));
                    throw new IllegalArgumentException("HotdropId is already taken");
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
                    log.info("Saved old profile picture for user: {}", MaskUtils.maskIdentifier(currentUser.getHotdropId()));
                } catch (Exception e) {
                    log.error("Could not save old profile picture for user: {}", MaskUtils.maskIdentifier(currentUser.getHotdropId()), e);
                }
            }

            try {
                log.info("Uploading new profile picture for user: {}", MaskUtils.maskIdentifier(currentUser.getHotdropId()));
                Map<String, String> uploadResult = cloudinary.uploadImageForProfileImage(profilePicture);

                String newUploadedUrl = uploadResult.get("url");
                String newPublicId = uploadResult.get("publicId");

                if (newUploadedUrl == null || newPublicId == null) {
                    log.error("Profile picture upload failed because image details are missing for user: {}", MaskUtils.maskIdentifier(currentUser.getHotdropId()));
                    throw new IllegalStateException("Cloudinary service returned invalid response.");
                }

                currentUser.setProfileImageUrl(newUploadedUrl);
                currentUser.setProfileImagePublicId(newPublicId);
                log.info("Updated profile picture for user: {}", MaskUtils.maskIdentifier(currentUser.getHotdropId()));
            } catch (Exception e) {
                log.error("Failed to upload profile picture for user: {}", MaskUtils.maskIdentifier(currentUser.getHotdropId()), e);
                throw new IllegalStateException("File upload sequence processing failed due to an external service error.", e);
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
        log.info("Updated profile for user: {}", MaskUtils.maskIdentifier(updatedUser.getHotdropId()));

                redisEvictionHelper.evictCacheEntriesByPrefix("publicUserProfiles", "user:" + oldHotdropId.toLowerCase().trim());
        if (!oldHotdropId.equals(updatedUser.getHotdropId())) {
            redisEvictionHelper.evictCacheEntriesByPrefix("publicUserProfiles", "user:" + updatedUser.getHotdropId().toLowerCase().trim());
        }
        redisEvictionHelper.evictEntireCache("userSearchTop5");
        redisEvictionHelper.evictCacheEntriesByPrefix("userPostsPaged", "user:" + updatedUser.getId().toString());
        redisEvictionHelper.evictCacheEntriesByPrefix("userFollowersPaged", "user:" + updatedUser.getId().toString() + ":viewer:");
        redisEvictionHelper.evictCacheEntriesByPrefix("userFollowingPaged", "user:" + updatedUser.getId().toString() + ":viewer:");

        int postCount = postRepo.countByUser(updatedUser);
        int followerCount = followRepo.countByFollowing(updatedUser);
        int followingCount = followRepo.countByFollower(updatedUser);
        return userMapper.toResponseDto(updatedUser, postCount, followerCount, followingCount);
    }

    @Override
    @Transactional(readOnly = true)
    public MeResponseDto getMeByHotdropId(String hotdropId) {
        log.info("Getting profile details for user: {}", MaskUtils.maskIdentifier(hotdropId));

        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", MaskUtils.maskIdentifier(hotdropId));
                    return new ResourceNotFoundException("User not found with email: " + hotdropId);
                });

        return getMe(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public MeResponseDto getMe(UUID userId) {
        log.info("Getting account details for user: {}", userId);

        User user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });

        List<Post> userPosts = postRepo.findByUserIdOrderByCreatedAtDesc(userId);
        int followerCount = followRepo.countByFollowing(user);
        int followingCount = followRepo.countByFollower(user);
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .collect(Collectors.toSet());
        UserResponseDto userDto = userMapper.toResponseDto(user, userPosts.size(), followerCount, followingCount);
         List<UUID> postIds = userPosts.stream().map(Post::getId).toList();
         Set<UUID> likedPostIds = postIds.isEmpty()
                ? Collections.emptySet()
                : likeRepo.findLikedPostIdsByUserIdAndPostIds(user.getId(), postIds);
        PostResponseDto.UserSummaryDto creator = postMapper.toUserSummaryDto(user);
        List<PostResponseDto> postDtos = userPosts.stream().map(post -> {
            boolean isLiked = likedPostIds.contains(post.getId());
            return postMapper.toResponseDto(post, isLiked, creator);
        }).toList();

        log.info("Loaded account details for user {} with {} posts", MaskUtils.maskIdentifier(user.getHotdropId()), postDtos.size());

        return userMapper.toMeResponseDto(userDto, postDtos); }

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


     @Cacheable(
            value = "userSearchTop5",
             key = "#query.toLowerCase().trim()",
             condition = "#query != null && !#query.trim().isEmpty()",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<PostResponseDto.UserSummaryDto> searchTop5Users(String query) {
        log.info("Searching users matching: {}", query);

        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        String cleanQuery = query.trim();
        List<User> users = userRepo.searchTop5Users(cleanQuery);
        log.info("Found {} users matching: {}", users.size(), cleanQuery);

        return users.stream()
                .map(user -> postMapper.toUserSummaryDto(user))
                .toList();
    }
}












