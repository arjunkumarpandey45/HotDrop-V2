package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.*;

import com.arjun.hotdrop_backend.scheduler.LinkTrackingScheduler;
import com.arjun.hotdrop_backend.service.PostService;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;


import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final LinkTrackingScheduler linkTrackingScheduler;

    @PostMapping("/verify-link")
    public ResponseEntity<LinkVerificationResponseDto> verifyLink(
            @Valid @RequestBody LinkVerificationRequestDto requestDto) {
        LinkVerificationResponseDto response = postService.verifyProjectLink(requestDto.getUrl());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-tracker")
    public ResponseEntity<String> triggerTrackerManual() {

        linkTrackingScheduler.startLiveTracking();
        return ResponseEntity.ok("Tracking engine triggered successfully! Check your console logs. 🚀");
    }



    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PostResponseDto>> createPost(
            @Valid @ModelAttribute CreatePostDto createPostDto,
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal UserDetails userDetails) {

        
        String userEmail = userDetails.getUsername();

        PostResponseDto savedPost = postService.createNewPost(createPostDto, files, userEmail);

        return ResponseHandler.generateResponse(
                HttpStatus.CREATED,
                "Project Dropped Successfully! 🔥",
                savedPost
        );
    }
}