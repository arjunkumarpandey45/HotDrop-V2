package com.arjun.hotdrop_backend.controller;


import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.service.UserService;
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

   @GetMapping("/search/{hotdropId}")
   public ResponseEntity<ApiResponse<UserResponseOnSearchDto>> searchUserProfile(
           @PathVariable String hotdropId,
           @AuthenticationPrincipal UserDetails userDetails) {
      String currentLoggedInHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
      log.info("Searching profile for user: {} (viewer: {})", hotdropId, currentLoggedInHotdropId);

      UserResponseOnSearchDto searchDto = userService.getUserByHotDropId(hotdropId, currentLoggedInHotdropId);
      log.info("Profile found successfully for user: {}", hotdropId);

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "User profile fetched successfully",
              searchDto
      );
   }

   @PostMapping("/follow")
   public ResponseEntity<ApiResponse<FollowResponseDto>> toggleFollow(
           @RequestBody Map<String, String> requestBody,
           @AuthenticationPrincipal UserDetails userDetails) {

      String currentHotdropId = userDetails.getUsername();
      UUID userIdToFollow = UUID.fromString(requestBody.get("userIdToFollow"));
      log.info("User {} requested to toggle follow for user ID: {}", currentHotdropId, userIdToFollow);

      FollowResponseDto responseDto = userService.toggleFollowUser(userIdToFollow, currentHotdropId);

      String dynamicMessage = responseDto.isFollowing()
              ? "Successfully followed @" + responseDto.getHotdropId()
              : "Successfully unfollowed @" + responseDto.getHotdropId();

      log.info("User {} {}: @{}", currentHotdropId, responseDto.isFollowing() ? "followed" : "unfollowed", responseDto.getHotdropId());

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              dynamicMessage,
              responseDto
      );
   }

   @GetMapping("/{userId}/get-all-followers")
   public ResponseEntity<List<FollowerUserDto>> getFollowers(
           @PathVariable UUID userId,
           @AuthenticationPrincipal UserDetails userDetails) {

      String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
      log.info("Fetching followers for user ID: {} (viewer: {})", userId, currentHotdropId);

      List<FollowerUserDto> followers = userService.getUserFollowers(userId, currentHotdropId);
      log.info("Fetched {} followers for user ID: {}", followers.size(), userId);

      return ResponseEntity.ok(followers);
   }

   @PutMapping(value = "/update-profile/{userIdFromParams}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   public ResponseEntity<ApiResponse<UserResponseDto>> updateProfile(
           @PathVariable UUID userIdFromParams,
           @ModelAttribute ProfileUpdateRequestDto requestDto,
           @AuthenticationPrincipal UserDetails userDetails) {
      String currentHotdropId = userDetails.getUsername();
      log.info("Received profile update request for user ID: {} by: {}", userIdFromParams, currentHotdropId);

      UserResponseDto updatedProfile = userService.updateProfileDetails(
              userIdFromParams,
              currentHotdropId,
              requestDto
      );
      log.info("Profile updated successfully for user: {}", currentHotdropId);

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "Profile updated successfully! ✨",
              updatedProfile
      );
   }

   @GetMapping("/me")
   public ResponseEntity<ApiResponse<MeResponseDto>> getMe(Authentication authentication) {
      if (authentication == null || !authentication.isAuthenticated()) {
         log.error("Failed to fetch session: user is not authenticated");
         return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "User session not found or token missing", null);
      }

      String hotdropId = authentication.getName();
      log.info("Fetching full profile details for logged-in user: {}", hotdropId);

      MeResponseDto response = userService.getMeByHotdropId(hotdropId);
      log.info("Successfully fetched profile details for logged-in user: {}", hotdropId);

      return ResponseHandler.generateResponse(HttpStatus.OK, "User found successfully", response);
   }

   @GetMapping("/{userId}/get-all-following")
   public ResponseEntity<List<UserResponseDto>> getFollowing(@PathVariable UUID userId) {
      log.info("Fetching following list for user ID: {}", userId);
      List<UserResponseDto> followingList = userService.getFollowingList(userId);
      log.info("Fetched {} following users for user ID: {}", followingList.size(), userId);
      return ResponseEntity.ok(followingList);
   }

   @GetMapping("/suggestions/{query}")
   public ResponseEntity<ApiResponse<List<PostResponseDto.UserSummaryDto>>> searchUsersSuggestions(@PathVariable String query) {
      log.info("Searching user suggestions with query: '{}'", query);
      List<PostResponseDto.UserSummaryDto> suggestions = userService.searchTop5Users(query);
      log.info("Found {} user suggestions for query: '{}'", suggestions.size(), query);

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "User search suggestions fetched successfully",
              suggestions
      );
   }
}
