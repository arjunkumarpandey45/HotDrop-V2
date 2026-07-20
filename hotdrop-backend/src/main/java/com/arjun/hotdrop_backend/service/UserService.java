package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.FollowResponseDto;
import com.arjun.hotdrop_backend.dto.ProfileUpdateRequestDto;
import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.dto.UserResponseOnSearchDto;
import com.arjun.hotdrop_backend.entity.Follow;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.entity.UserImageHistory;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.FollowRepo;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserImageHistoryRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;


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

