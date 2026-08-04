package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.*;

import com.arjun.hotdrop_backend.service.UserService;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import lombok.RequiredArgsConstructor;
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
      UserResponseOnSearchDto searchDto = userService.getUserByHotDropId(hotdropId, currentLoggedInHotdropId);
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

      FollowResponseDto responseDto = userService.toggleFollowUser(userIdToFollow, currentHotdropId);

      String dynamicMessage = responseDto.isFollowing()
              ? "Successfully followed @" + responseDto.getHotdropId()
              : "Successfully unfollowed @" + responseDto.getHotdropId();

      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              dynamicMessage,
              responseDto
      );
   }

   @GetMapping("/{userId}/followers")
   public ResponseEntity<List<FollowerUserDto>> getFollowers(
           @PathVariable UUID userId,
           @AuthenticationPrincipal UserDetails userDetails) {


      String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;


      List<FollowerUserDto> followers = userService.getUserFollowers(userId, currentHotdropId);

      return ResponseEntity.ok(followers);
   }
   @PutMapping(value = "/update/{userIdFromParams}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   public ResponseEntity<ApiResponse<UserResponseDto>> updateProfile(
           @PathVariable UUID userIdFromParams,
           @ModelAttribute ProfileUpdateRequestDto requestDto,
           @AuthenticationPrincipal UserDetails userDetails) {
      System.out.println("====== SYSTEM DEBUG START ======");
      System.out.println("====== SYSTEM DEBUG START ======");
      System.out.println("DTO Instance: " + (requestDto != null ? "INITIALIZED" : "NULL"));
      if (requestDto != null) {
         System.out.println("HotdropId from Form: " + requestDto.getHotdropId());
         System.out.println("LeetcodeUrl from Form: " + requestDto.getLeetcodeUrl());
         System.out.println("File Object Present: " + (requestDto.getProfilePicture() != null));
         if (requestDto.getProfilePicture() != null) {
            System.out.println("File Size: " + requestDto.getProfilePicture().getSize());
            System.out.println("File Param Name: " + requestDto.getProfilePicture().getName());
         }
      }
      System.out.println("====== SYSTEM DEBUG END ======");
      String currentHotdropId = userDetails.getUsername();


      UserResponseDto updatedProfile = userService.updateProfileDetails(
              userIdFromParams,
              currentHotdropId,
              requestDto
      );
      System.out.println("====== SYSTEM DEBUG END ======");
      return ResponseHandler.generateResponse(
              HttpStatus.OK,
              "Profile updated successfully! ✨",
              updatedProfile
      );
   }
   @GetMapping("/me")
   public ResponseEntity<ApiResponse<MeResponseDto>> getMe(Authentication authentication) {
      if (authentication == null || !authentication.isAuthenticated()) {
         return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "User session not found or token missing", null);
      }

      // authentication.getName() returns the email/username set in JWT filter
      String hotdropId = authentication.getName();
      MeResponseDto response = userService.getMeByHotdropId(hotdropId);

      return ResponseHandler.generateResponse(HttpStatus.OK, "User found successfully", response);
   }


   @GetMapping("/{userId}/following")
   public ResponseEntity<List<UserResponseDto>> getFollowing(@PathVariable UUID userId) {
      return ResponseEntity.ok(userService.getFollowingList(userId));
   }
   @GetMapping("/suggestions/{query}")
   public ResponseEntity<ApiResponse<List<PostResponseDto.UserSummaryDto>>> searchUsersSuggestions(@PathVariable String query) {
      List<PostResponseDto.UserSummaryDto> suggestions = userService.searchTop5Users(query);

      return ResponseHandler.generateResponse(

              HttpStatus.OK,
              "User search suggestions fetched successfully",
              suggestions
      );
   }
}
