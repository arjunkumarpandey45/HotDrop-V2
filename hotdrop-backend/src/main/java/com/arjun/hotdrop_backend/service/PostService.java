package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PostService {
    LinkVerificationResponseDto verifyProjectLink(String inputUrl);
    PostResponseDto createNewPost(CreatePostDto dto, MultipartFile[] files, String hotdropId);
    void deleteExistingPost(UUID postId, String currentHotdropId);
    PostListResponseDto getAllPostsCompiledFeed(int page, int size, String sortBy, String direction, String search, String currentHotdropId);
    PostResponseDto getPostByPostId(UUID postId);
    PostResponseDto toggleLike(UUID postId, String hotdropId);
    CommentResponseDto addCommentToPost(UUID postId, String hotdropId, String text);
    void deleteComment(UUID commentId, String hotdropId);
    PagedResponse<PostResponseDto> getPostsByUserIdPaged(UUID userId, int page, int size, String currentHotdropId);
    PostResponseDto getPostByShareUrl(String shareUrl, String hotdropId);
    PagedResponse<CommentResponseDto> getCommentsByPostId(UUID postId, int page, int size);
    PagedResponse<PostResponseDto.UserSummaryDto> getUsersWhoLikedPost(UUID postId, int page, int size);
}