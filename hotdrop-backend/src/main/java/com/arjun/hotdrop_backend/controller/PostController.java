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

    @RateLimited(capacity = 10, refillTokens = 10, refillDurationSeconds = 60)
    @PostMapping("/verify-link")
    public ResponseEntity<LinkVerificationResponseDto> verifyLink(
            @Valid @RequestBody LinkVerificationRequestDto requestDto) {
        log.info("Checking project link: {}", requestDto.getUrl());
        LinkVerificationResponseDto response = postService.verifyProjectLink(requestDto.getUrl());
        log.info("Finished checking link {}. Live: {}", requestDto.getUrl(), response.isLive());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-tracker")
    public ResponseEntity<String> triggerTrackerManual() {
        log.info("Manually triggered link check.");
        linkTrackingScheduler.startLiveTracking();
        log.info("Started link check.");
        return ResponseEntity.ok("Tracking engine triggered successfully! Check your console logs. 🚀");
    }

    @RateLimited(capacity = 3, refillTokens = 3, refillDurationSeconds = 60)
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PostResponseDto>> createPost(
            @Valid @ModelAttribute CreatePostDto createPostDto,
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal UserDetails userDetails) {

        String userEmail = userDetails.getUsername();
        log.info("Creating post '{}' for user: {}", createPostDto.getTitle(), userEmail);

        PostResponseDto savedPost = postService.createNewPost(createPostDto, files, userEmail);
        log.info("Created post '{}' with ID {} for user: {}", savedPost.getTitle(), savedPost.getId(), userEmail);

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
        log.info("User {} is deleting post ID: {}", currentHotdropId, postId);

        postService.deleteExistingPost(postId, currentHotdropId);
        log.info("Deleted post ID: {} for user: {}", postId, currentHotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Project Dropped successfuly",
                null
        );
    }
    @RateLimited(capacity = 60, refillTokens = 60, refillDurationSeconds = 60)
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<PostListResponseDto>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails) {

        String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
        log.info("Getting feed: page={}, size={}, sortBy={}, direction={}, search='{}', viewer={}",
                page, size, sortBy, direction, search, currentHotdropId);

        PostListResponseDto feed = postService.getAllPostsCompiledFeed(page, size, sortBy, direction, search, currentHotdropId);
        log.info("Loaded {} posts for page {}", feed.getPosts().size(), page);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Feed compiled successfully",
                feed
        );
    }

    @GetMapping("get-post-by-postId/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> getPostViaPostId(@PathVariable String postId) {
        log.info("Getting post with ID: {}", postId);
        UUID validUuid;
        try {
            validUuid = UUID.fromString(postId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid post ID format: {}", postId);
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

        log.info("Loaded post with ID: {}", validUuid);
        return ResponseHandler.generateResponse(HttpStatus.OK, "Post fetched successfully", post);
    }
    @RateLimited(capacity = 30, refillTokens = 30, refillDurationSeconds = 60)
    @PostMapping("/like-post/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> likePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        String hotdropId = userDetails.getUsername();
        log.info("User {} toggling like on post ID: {}", hotdropId, postId);

        PostResponseDto updatedPost = postService.toggleLike(postId, hotdropId);
        log.info("Updated like on post ID: {} by user {}. Likes: {}", postId, hotdropId, updatedPost.getLikeCount());

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Action successful",
                updatedPost
        );
    }
    @RateLimited(capacity = 10, refillTokens = 10, refillDurationSeconds = 60)
    @PostMapping("/comment-to-post/{postId}")
    public ResponseEntity<ApiResponse<CommentResponseDto>> comment(
            @PathVariable UUID postId,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal UserDetails userDetails) {
        String hotdropId = userDetails.getUsername();
        String text = requestBody.get("text");
        log.info("User {} adding comment to post ID: {}", hotdropId, postId);

        CommentResponseDto commentDto = postService.addCommentToPost(postId, hotdropId, text);
        log.info("Added comment to post ID: {} by user {}", postId, hotdropId);

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
        log.info("User {} is deleting comment ID: {}", hotdropId, commentId);

        postService.deleteComment(commentId, hotdropId);
        log.info("Deleted comment ID: {} by user: {}", commentId, hotdropId);

        return ResponseHandler.generateResponse(
                HttpStatus.NO_CONTENT,
                "Comment Deleted Successfully from " + hotdropId + "'s post",
                null
        );
    }

    @GetMapping("/get-user-post/{userId}")
    public ResponseEntity<ApiResponse<PagedResponse<PostResponseDto>>> getUserPosts(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        String currentHotdropId = (userDetails != null) ? userDetails.getUsername() : null;
        log.info("Getting posts for user ID: {}, page: {}, size: {}", userId, page, size);

        PagedResponse<PostResponseDto> paginatedPosts = postService.getPostsByUserIdPaged(userId, page, size, currentHotdropId);
        log.info("Loaded {} posts for user ID: {}", paginatedPosts.getContent().size(), userId);

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
        log.info("Getting post with link '{}' for user: {}", shareUrl, hotdropId);

        PostResponseDto response = postService.getPostByShareUrl(shareUrl, hotdropId);
        log.info("Loaded post with link: '{}'", shareUrl);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-comment-by-post-id/{postId}")
    public ResponseEntity<ApiResponse<PagedResponse<CommentResponseDto>>> getCommentsByPostId(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Getting comments for post ID: {}, page: {}, size: {}", postId, page, size);
        PagedResponse<CommentResponseDto> comments = postService.getCommentsByPostId(postId, page, size);
        log.info("Loaded {} comments for post ID: {}", comments.getContent().size(), postId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Comments fetched successfully",
                comments
        );
    }

    @GetMapping("/{postId}/get-who-likes-post")
    public ResponseEntity<ApiResponse<PagedResponse<PostResponseDto.UserSummaryDto>>> getUsersWhoLikedPost(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Getting users who liked post ID: {}, page: {}, size: {}", postId, page, size);
        PagedResponse<PostResponseDto.UserSummaryDto> likedUsers = postService.getUsersWhoLikedPost(postId, page, size);
        log.info("Loaded {} users who liked post ID: {}", likedUsers.getContent().size(), postId);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Users who liked the post fetched successfully",
                likedUsers
        );
    }
}