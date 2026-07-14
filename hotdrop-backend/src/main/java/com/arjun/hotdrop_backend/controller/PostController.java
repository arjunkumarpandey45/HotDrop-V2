package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.*;

import com.arjun.hotdrop_backend.entity.Post;
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

import java.util.UUID;

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

    @DeleteMapping("/{postId}/delete-post")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable UUID postId
            , @AuthenticationPrincipal UserDetails userDetails) {
        String currentHotdropId = userDetails.getUsername();
        postService.deleteExistingPost(postId, currentHotdropId);
        return ResponseHandler.generateResponse(
                HttpStatus.OK
                , "Project Dropped successfuly",
                null);
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<PostListResponseDto>> getAllPosts(
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "10", required = false) int size,
            @RequestParam(value = "sortBy", defaultValue = "created_at", required = false) String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC", required = false) String direction,
            @RequestParam(value = "search", required = false) String search) {

        PostListResponseDto feed = postService.getAllPostsCompiledFeed(page, size, sortBy, direction, search);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Feed data populated dynamically! 🚀",
                feed
        );
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> getPostViaPostId(@PathVariable String postId) {
        UUID validUuid;
        try {

            validUuid = UUID.fromString(postId);
        } catch (IllegalArgumentException e) {

            return ResponseHandler.generateResponse(
                    HttpStatus.BAD_REQUEST,
                    "Provided Post ID format is invalid.",
                    null
            );
        }

        PostResponseDto post = postService.getPostByPostId(validUuid);

        if (post == null) {
            return ResponseHandler.generateResponse(
                    HttpStatus.NOT_FOUND,
                    "Post does not exist.",
                    null
            );
        }

        return ResponseHandler.generateResponse(HttpStatus.OK, "Post fetched successfully", post);
    }

}