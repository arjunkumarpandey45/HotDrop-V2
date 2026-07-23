package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.*;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final CloudinaryService cloudinary;
    private final PostRepo postRepo;
    private final UserRepo userRepo;
    private final FollowRepo followRepo;
    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private final LikeRepo likeRepo;
    private  final UserImageHistoryRepo userImageHistoryRepo;

    public UserResponseOnSearchDto getUserByHotDropId(String hotdropId, String currentLoggedInHotdropId) {


        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("Search failed: HotdropId '{}' does not exist in database", hotdropId);
                    return new RuntimeException("User profile not found with ID: " + hotdropId);
                });


        int postCount = postRepo.countByUser(currentUser);
        int followerCount = followRepo.countByFollowing(currentUser);
        int followingCount = followRepo.countByFollower(currentUser);


        boolean isOwner = currentLoggedInHotdropId != null && currentLoggedInHotdropId.equals(hotdropId);


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

    @Transactional
    public FollowResponseDto toggleFollowUser(UUID userIdToFollow, String currentHotdropId) {
        User currentUser = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        User targetUser = userRepo.findById(userIdToFollow)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (currentUser.getId().equals(targetUser.getId())) {
            throw new RuntimeException("You cannot follow yourself");
        }

        Optional<Follow> existingFollow = followRepo.findByFollowerAndFollowing(currentUser, targetUser);
        boolean isFollowingNow;

        if (existingFollow.isPresent()) {
            followRepo.delete(existingFollow.get());
            isFollowingNow = false;
        } else {
            Follow newFollow = Follow.builder()
                    .follower(currentUser)
                    .following(targetUser)
                    .build();
            followRepo.save(newFollow);
            isFollowingNow = true;
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

    @Transactional
    public UserResponseDto updateProfileDetails(
            UUID userIdFromParams,
            String currentHotdropId,
            ProfileUpdateRequestDto requestDto) {


        User currentUser = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> new RuntimeException("Authenticated user session data not found"));

        if (userIdFromParams != null && !currentUser.getId().equals(userIdFromParams)) {
            throw new RuntimeException("Access Denied: You are not the owner of this profile");
        }


        if (requestDto.getHotdropId() != null && !requestDto.getHotdropId().isBlank()) {
            String newHotdropId = requestDto.getHotdropId().trim();
            if (!newHotdropId.equals(currentUser.getHotdropId())) {
                boolean isTaken = userRepo.existsByHotdropId(newHotdropId);
                if (isTaken) {
                    throw new RuntimeException("Constraint Violation: HotdropId is already taken");
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
                    log.info("Archived old profile image URL [{}] and publicId [{}] to history storage tracking.",
                            currentUser.getProfileImageUrl(), existingPublicId);
                } catch (Exception e) {
                    log.error("Failed to log image history record block: {}", e.getMessage());
                }
            }


            try {
                log.info("Uploading fresh profile image buffer stream data to Cloudinary");


                Map<String, String> uploadResult = cloudinary.uploadImageForProfileImage(profilePicture);

                     String newUploadedUrl = uploadResult.get("url");
                String newPublicId = uploadResult.get("publicId"); 

                if (newUploadedUrl == null || newPublicId == null) {
                    throw new RuntimeException("Keys mismatch: Retrieved null values from CloudinaryService response map.");
                }


                currentUser.setProfileImageUrl(newUploadedUrl);
                currentUser.setProfileImagePublicId(newPublicId);

                log.info("Successfully bound new image state. URL: {}, PublicId: {}", newUploadedUrl, newPublicId);
            } catch (Exception e) {
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
        log.info("Successfully flushed user data transition blocks for hotdropId: {}", updatedUser.getHotdropId());

        return userMapper.toResponseDto(updatedUser);
    }
    @Transactional

    public MeResponseDto getMeByHotdropId(String hotdropId) {
        // 1. Fetch User by email
        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + hotdropId));

        // 2. Reuse the existing getMe logic via userId
        return getMe(user.getId());
    }
    @Transactional
    public MeResponseDto getMe(UUID userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
// 2. Fetch Posts
        List<Post> userPosts = postRepo.findByUserIdOrderByCreatedAtDesc(userId);;
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

        // 6. Return combined MeResponseDto
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
            log.warn("Regex boundary mismatch parsing backup public_id from url string: {}", url);
            return null;
        }
    }




}

