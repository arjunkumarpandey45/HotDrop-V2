package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.ApiResponse;
import com.arjun.hotdrop_backend.dto.FollowResponseDto;
import com.arjun.hotdrop_backend.dto.UserResponseOnSearchDto;
import com.arjun.hotdrop_backend.service.UserService;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
   private final UserService userService;
   @GetMapping("/{hotdropId}")
    public ResponseEntity<ApiResponse<UserResponseOnSearchDto>> userByHotDropId(@PathVariable String hotdropId){
       UserResponseOnSearchDto user=userService.getUserByHotDropId(hotdropId);
       return ResponseHandler.generateResponse(
               HttpStatus.OK,"User fetched successfully",user
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
}
