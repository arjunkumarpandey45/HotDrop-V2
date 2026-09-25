package com.arjun.hotdrop_backend.controller;


import com.arjun.hotdrop_backend.annotation.RateLimited;
import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.service.UserService;
import com.arjun.hotdrop_backend.utils.MaskUtils;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
   private final UserService userService;
   @RateLimited(capacity = 30, refillTokens = 30, refillDurationSeconds = 60)
   @GetMapping("/search/{hotdropId}")
   public ResponseEntity<ApiResponse<UserResponseOnSearchDto>> searchUserProfile(
           @PathVariable String hotdropId,
           @AuthenticationPrincipal UserDetails userDetails) {
      String currentLoggedInHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
      log.info("Looking for user profile: {} (viewed by {})", MaskUtils.maskIdentifier(hotdropId), MaskUtils.maskIdentifier(currentLoggedInHotdropId));

      UserResponseOnSearchDto searchDto = userService.getUserByHotDropId(hotdropId, currentLoggedInHotdropId);
      log.info("Found profile for user: {}", MaskUtils.maskIdentifier(hotdropId));

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "User profile fetched successfully",
              searchDto
      );
   }

   @PostMapping("/follow")
   @RateLimited(capacity = 20, refillTokens = 20, refillDurationSeconds = 60)
   public ResponseEntity<ApiResponse<FollowResponseDto>> toggleFollow(
           @RequestBody Map<String, String> requestBody,
           @AuthenticationPrincipal UserDetails userDetails) {

      String currentHotdropId = userDetails.getUsername();
      UUID userIdToFollow = UUID.fromString(requestBody.get("userIdToFollow"));
      log.info("User {} wants to follow or unfollow user ID: {}", MaskUtils.maskIdentifier(currentHotdropId), userIdToFollow);

      FollowResponseDto responseDto = userService.toggleFollowUser(userIdToFollow, currentHotdropId);

      String dynamicMessage = responseDto.isFollowing()
              ? "Successfully followed @" + responseDto.getHotdropId()
              : "Successfully unfollowed @" + responseDto.getHotdropId();

      log.info("User {} {} @{}", MaskUtils.maskIdentifier(currentHotdropId), responseDto.isFollowing() ? "followed" : "unfollowed", MaskUtils.maskIdentifier(responseDto.getHotdropId()));

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              dynamicMessage,
              responseDto
      );
   }

   @GetMapping("/{userId}/get-all-followers")
   public ResponseEntity<ApiResponse<PagedResponse<FollowerUserDto>>> getFollowers(
           @PathVariable UUID userId,
           @RequestParam(defaultValue = "0") int page,
           @RequestParam(defaultValue = "10") int size,
           @AuthenticationPrincipal UserDetails userDetails) {

      String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
      log.info("Getting followers for user ID: {}, page: {}, size: {} (viewed by {})", userId, page, size, MaskUtils.maskIdentifier(currentHotdropId));

      PagedResponse<FollowerUserDto> followers = userService.getUserFollowers(userId, currentHotdropId, page, size);
      log.info("Loaded {} followers for user ID: {}", followers.getContent().size(), userId);

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "Followers fetched successfully",
              followers
      );
   }
   @RateLimited(capacity = 5, refillTokens = 5, refillDurationSeconds = 60)
   @PutMapping(value = "/update-profile/{userIdFromParams}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   public ResponseEntity<ApiResponse<UserResponseDto>> updateProfile(
           @PathVariable UUID userIdFromParams,
           @ModelAttribute ProfileUpdateRequestDto requestDto,
           @AuthenticationPrincipal UserDetails userDetails) {
      String currentHotdropId = userDetails.getUsername();
      log.info("Updating profile for user ID: {} by: {}", userIdFromParams, MaskUtils.maskIdentifier(currentHotdropId));

      UserResponseDto updatedProfile = userService.updateProfileDetails(
              userIdFromParams,
              currentHotdropId,
              requestDto
      );
      log.info("Updated profile for user: {}", MaskUtils.maskIdentifier(currentHotdropId));

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "Profile updated successfully! ✨",
              updatedProfile
      );
   }

   @GetMapping("/me")
   public ResponseEntity<ApiResponse<MeResponseDto>> getMe(Authentication authentication) {
      if (authentication == null || !authentication.isAuthenticated()) {
         log.warn("Cannot load profile: user is not logged in or token missing.");
         return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "User session not found or token missing", null);
      }

      String hotdropId = authentication.getName();
      log.info("Getting profile details for: {}", MaskUtils.maskIdentifier(hotdropId));

      MeResponseDto response = userService.getMeByHotdropId(hotdropId);
      log.info("Loaded profile details for: {}", MaskUtils.maskIdentifier(hotdropId));

      return ResponseHandler.generateResponse(HttpStatus.OK, "User found successfully", response);
   }

      @GetMapping("/{userId}/get-all-following")
   public ResponseEntity<ApiResponse<PagedResponse<FollowerUserDto>>> getFollowing(
           @PathVariable UUID userId,
           @AuthenticationPrincipal UserDetails userDetails,
           @RequestParam(defaultValue = "0") int page,
           @RequestParam(defaultValue = "10") int size) {
      String currentHotdropId = userDetails != null ? userDetails.getUsername() : null;
      log.info("Getting following list for user ID: {}, viewer: {}, page: {}, size: {}", userId, currentHotdropId, page, size);
      PagedResponse<FollowerUserDto> followingList = userService.getFollowingList(userId, currentHotdropId, page, size);
      log.info("Loaded {} users followed by user ID: {}", followingList.getContent().size(), userId);
      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "Following list fetched successfully",
              followingList
      );
   }
   @RateLimited(capacity = 45, refillTokens = 45, refillDurationSeconds = 60)
   @GetMapping("/suggestions/{query}")
   public ResponseEntity<ApiResponse<List<PostResponseDto.UserSummaryDto>>> searchUsersSuggestions(@PathVariable String query) {
      log.info("Searching users matching: '{}'", query);
      List<PostResponseDto.UserSummaryDto> suggestions = userService.searchTop5Users(query);
      log.info("Found {} matching users for: '{}'", suggestions.size(), query);

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "User search suggestions fetched successfully",
              suggestions
      );
   }
}

