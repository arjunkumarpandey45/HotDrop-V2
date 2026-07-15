package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.scheduler.LinkTrackingScheduler;
import com.arjun.hotdrop_backend.service.PostService;
import com.arjun.hotdrop_backend.utils.JwtUtils;
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


import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {
    private JwtUtils jwtUtils;
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
    public ResponseEntity<ApiResponse<PostListResponseDto>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails) {


        String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;

        PostListResponseDto feed = postService.getAllPostsCompiledFeed(page, size, sortBy, direction, search, currentHotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Feed compiled successfully",
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

    ;

    @PostMapping("/like/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> likePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        String hotdropId = userDetails.getUsername();
        PostResponseDto updatedPost = postService.toggleLike(postId, hotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Action successful",
                updatedPost
        );
    }

    @PostMapping("/comment/{postId}")
    public ResponseEntity<ApiResponse<CommentResponseDto>> comment(
            @PathVariable UUID postId,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal UserDetails userDetails) {
        String hotdropId = userDetails.getUsername();
        String text = requestBody.get("text");
        CommentResponseDto commentDto =   postService.addCommentToPost(postId,hotdropId,text);
        return ResponseHandler.generateResponse(
                HttpStatus.CREATED,
                "Comment added successfully! 🔥",
                commentDto
        );
    }
}