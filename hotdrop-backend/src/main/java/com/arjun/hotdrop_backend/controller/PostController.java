package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.annotation.RateLimited;
import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.scheduler.LinkTrackingScheduler;
import com.arjun.hotdrop_backend.service.PostService;

import com.arjun.hotdrop_backend.utils.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final LinkTrackingScheduler linkTrackingScheduler;

    @RateLimited
    @PostMapping("/verify-link")
    public ResponseEntity<LinkVerificationResponseDto> verifyLink(
            @Valid @RequestBody LinkVerificationRequestDto requestDto) {
        log.info("Checking live status for project URL: {}", requestDto.getUrl());
        LinkVerificationResponseDto response = postService.verifyProjectLink(requestDto.getUrl());
        log.info("Project URL verification completed for: {}. Is Live: {}", requestDto.getUrl(), response.isLive());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-tracker")
    public ResponseEntity<String> triggerTrackerManual() {
        log.info("Manual trigger received for background link tracking engine");
        linkTrackingScheduler.startLiveTracking();
        log.info("Background link tracking engine started successfully");
        return ResponseEntity.ok("Tracking engine triggered successfully! Check your console logs. 🚀");
    }

    @RateLimited
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PostResponseDto>> createPost(
            @Valid @ModelAttribute CreatePostDto createPostDto,
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal UserDetails userDetails) {

        String userEmail = userDetails.getUsername();
        log.info("Received request to create project post: '{}' from user: {}", createPostDto.getTitle(), userEmail);

        PostResponseDto savedPost = postService.createNewPost(createPostDto, files, userEmail);
        log.info("Project post '{}' created successfully with ID: {} for user: {}", savedPost.getTitle(), savedPost.getId(), userEmail);

        return ResponseHandler.generateResponse(
                HttpStatus.CREATED,
                "Project Dropped Successfully! 🔥",
                savedPost
        );
    }

    @DeleteMapping("/delete-post/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String currentHotdropId = userDetails.getUsername();
        log.info("Received request from user: {} to delete post with ID: {}", currentHotdropId, postId);

        postService.deleteExistingPost(postId, currentHotdropId);
        log.info("Post with ID: {} deleted successfully by user: {}", postId, currentHotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Project Dropped successfuly",
                null
        );
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
        log.info("Fetching post feed: page={}, size={}, sortBy={}, direction={}, search='{}', viewer={}",
                page, size, sortBy, direction, search, currentHotdropId);

        PostListResponseDto feed = postService.getAllPostsCompiledFeed(page, size, sortBy, direction, search, currentHotdropId);
        log.info("Successfully fetched {} feed posts for page {}", feed.getPosts().size(), page);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Feed compiled successfully",
                feed
        );
    }

    @GetMapping("get-post-by-postId/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> getPostViaPostId(@PathVariable String postId) {
        log.info("Received request to fetch post by ID: {}", postId);
        UUID validUuid;
        try {
            validUuid = UUID.fromString(postId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid post ID format supplied: {}", postId);
            return ResponseHandler.generateResponse(
                    HttpStatus.BAD_REQUEST,
                    "Provided Post ID format is invalid.",
                    null
            );
        }

        PostResponseDto post = postService.getPostByPostId(validUuid);

        if (post == null) {
            log.error("Post not found with ID: {}", validUuid);
            return ResponseHandler.generateResponse(
                    HttpStatus.NOT_FOUND,
                    "Post does not exist.",
                    null
            );
        }

        log.info("Post fetched successfully for ID: {}", validUuid);
        return ResponseHandler.generateResponse(HttpStatus.OK, "Post fetched successfully", post);
    }

    @PostMapping("/like-post/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> likePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        String hotdropId = userDetails.getUsername();
        log.info("User {} toggling like on post ID: {}", hotdropId, postId);

        PostResponseDto updatedPost = postService.toggleLike(postId, hotdropId);
        log.info("Like toggled on post ID: {} by user {}. Current likes: {}", postId, hotdropId, updatedPost.getLikeCount());

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Action successful",
                updatedPost
        );
    }

    @PostMapping("/comment-to-post/{postId}")
    public ResponseEntity<ApiResponse<CommentResponseDto>> comment(
            @PathVariable UUID postId,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal UserDetails userDetails) {
        String hotdropId = userDetails.getUsername();
        String text = requestBody.get("text");
        log.info("User {} adding comment to post ID: {}", hotdropId, postId);

        CommentResponseDto commentDto = postService.addCommentToPost(postId, hotdropId, text);
        log.info("Comment successfully added to post ID: {} by user {}", postId, hotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.CREATED,
                "Comment added successfully! 🔥",
                commentDto
        );
    }

    @DeleteMapping("/delete-comment/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String hotdropId = userDetails.getUsername();
        log.info("User {} requested deletion of comment ID: {}", hotdropId, commentId);

        postService.deleteComment(commentId, hotdropId);
        log.info("Comment ID: {} deleted successfully by user: {}", commentId, hotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.NO_CONTENT,
                "Comment Deleted Successfully from " + hotdropId + "'s post",
                null
        );
    }

    @GetMapping("/get-user-post/{userId}")
    public ResponseEntity<ApiResponse<PostListResponseDto>> getUserPosts(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
        log.info("Fetching posts created by user ID: {}, page: {}, size: {}", userId, page, size);

        PostListResponseDto paginatedPosts = postService.getPostsByUserIdPaged(userId, page, size, currentHotdropId);
        log.info("Successfully fetched {} posts for user ID: {}", paginatedPosts.getPosts().size(), userId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "User posts fetched successfully",
                paginatedPosts
        );
    }

    @GetMapping("/share-post/{shareUrl}")
    public ResponseEntity<PostResponseDto> getPostByShareUrl(
            @PathVariable String shareUrl,
            @AuthenticationPrincipal UserDetails userDetails) {

        String hotdropId = userDetails != null ? userDetails.getUsername() : null;
        log.info("Fetching post by share URL: '{}' for viewer: {}", shareUrl, hotdropId);

        PostResponseDto response = postService.getPostByShareUrl(shareUrl, hotdropId);
        log.info("Post fetched successfully by share URL: '{}'", shareUrl);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-comment-by-post-id/{postId}")
    public ResponseEntity<ApiResponse<List<CommentResponseDto>>> getCommentsByPostId(@PathVariable UUID postId) {
        log.info("Fetching all comments for post ID: {}", postId);
        List<CommentResponseDto> comments = postService.getCommentsByPostId(postId);
        log.info("Fetched {} comments for post ID: {}", comments.size(), postId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Comments fetched successfully",
                comments
        );
    }

    @GetMapping("/{postId}/get-who-likes-post")
    public ResponseEntity<ApiResponse<List<PostResponseDto.UserSummaryDto>>> getUsersWhoLikedPost(@PathVariable UUID postId) {
        log.info("Fetching list of users who liked post ID: {}", postId);
        List<PostResponseDto.UserSummaryDto> likedUsers = postService.getUsersWhoLikedPost(postId);
        log.info("Fetched {} users who liked post ID: {}", likedUsers.size(), postId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Users who liked the post fetched successfully",
                likedUsers
        );
    }
}