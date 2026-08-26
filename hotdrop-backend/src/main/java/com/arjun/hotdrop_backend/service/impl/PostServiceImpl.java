package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.*;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.mapper.PostMapperWithID;
import com.arjun.hotdrop_backend.repository.*;
import com.arjun.hotdrop_backend.service.CloudinaryService;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.service.PostService;
import com.arjun.hotdrop_backend.utils.SlugifyUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {
    private final LikeRepo likeRepo;
    private final UserRepo userRepo;
    private final PostRepo postRepo;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;
    private final List<String> userAgents;
    private final Random random;
    private final CommentRepo commentRepo;
    private final PostMapperWithID postMapperWithID;
    private final PostMapper postMapper;
    private final UserImageHistoryRepo userImageHistoryRepo;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public LinkVerificationResponseDto verifyProjectLink(String inputUrl) {
        if (inputUrl == null || inputUrl.isBlank()) {
            return LinkVerificationResponseDto.builder()
                    .isLive(false)
                    .url(inputUrl)
                    .message("URL cannot be empty!")
                    .build();
        }

        String cleanUrl = inputUrl.trim();
        if (!cleanUrl.toLowerCase().startsWith("http://") && !cleanUrl.toLowerCase().startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }

        String randomUA = userAgents.get(random.nextInt(userAgents.size()));

        try {
            HttpRequest headRequest = HttpRequest.newBuilder()
                    .uri(URI.create(cleanUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("User-Agent", randomUA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Cache-Control", "no-cache")
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<Void> headResponse = httpClient.send(headRequest, HttpResponse.BodyHandlers.discarding());
            if (headResponse.statusCode() >= 200 && headResponse.statusCode() < 400) {
                return LinkVerificationResponseDto.builder()
                        .isLive(true)
                        .url(cleanUrl)
                        .message("Link is live! 🔥 (Verified via HEAD)")
                        .build();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("HEAD verification thread context interrupted.");
        } catch (Exception ignored) {

        }

        try {
            HttpRequest getRequest = HttpRequest.newBuilder()
                    .uri(URI.create(cleanUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("User-Agent", randomUA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Cache-Control", "no-cache")
                    .GET()
                    .build();

            HttpResponse<Void> getResponse = httpClient.send(getRequest, HttpResponse.BodyHandlers.discarding());
            if (getResponse.statusCode() >= 200 && getResponse.statusCode() < 400) {
                return LinkVerificationResponseDto.builder()
                        .isLive(true)
                        .url(cleanUrl)
                        .message("Link is Live! 🔥 (Verified via GET)")
                        .build();
            }

            return LinkVerificationResponseDto.builder()
                    .isLive(false)
                    .url(cleanUrl)
                    .message("Link returned bad status code: " + getResponse.statusCode())
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("GET verification thread context interrupted.");
        } catch (Exception e) {

        }

        return LinkVerificationResponseDto.builder()
                .isLive(false)
                .url(cleanUrl)
                .message("Link is dead or completely unreachable.")
                .build();
    }

    private String sanitizeInput(String input) {
        if (input == null) return null;

        if (input.startsWith("\"") && input.endsWith("\"")) {
            return input.substring(1, input.length() - 1).replace("\\\"", "\"");
        }
        return input.replace("\"", "");
    }

    @Override
    @Transactional
    public PostResponseDto createNewPost(CreatePostDto dto, MultipartFile[] files, String hotdropId) {

        if (files == null || files.length == 0 || files[0].isEmpty()) {
            throw new RuntimeException("At least 1 image must be uploaded.");
        }
        User authenticatedUser = userRepo.findByHotdropId(String.valueOf(hotdropId))
                .orElseThrow(() -> new RuntimeException("User not found "));
        String cleanTitle = sanitizeInput(dto.getTitle());
        String cleanDescription = sanitizeInput(dto.getDescription());
        String cleanProjectUrl = sanitizeInput(dto.getProjectUrl());
        String uniqueShareUrl = SlugifyUtil.generateSlug(dto.getTitle()) + "-" + System.currentTimeMillis();

        List<String> cleanedTags = new ArrayList<>();
        if (dto.getTags() != null && !dto.getTags().isBlank()) {
            cleanedTags = Arrays.stream(dto.getTags().split(","))
                    .map(tag -> sanitizeInput(tag.trim().toLowerCase()))
                    .filter(tag -> !tag.isEmpty())
                    .collect(Collectors.toList());
        }

        Post post = Post.builder()
                .title(cleanTitle)
                .description(cleanDescription)
                .projectUrl(cleanProjectUrl)
                .shareUrl(uniqueShareUrl)
                .tags(cleanedTags)
                .user(authenticatedUser)
                .build();

        List<PostImage> postImages = new ArrayList<>();
        for (MultipartFile file : files) {
            Map<String, String> cloudMeta = cloudinaryService.uploadImageForPost(file);

            PostImage imageEntity = PostImage.builder()
                    .url(cloudMeta.get("url"))
                    .publicId(cloudMeta.get("publicId"))
                    .post(post)
                    .build();

            postImages.add(imageEntity);
        }

        post.setImages(postImages);

        Post savedPost = postRepo.save(post);
        log.info("Project dropped successfully! Saved Post ID: {}", savedPost.getId());

        return postMapper.toResponseDto(savedPost);
    }

    @Override
    @Transactional
    public void deleteExistingPost(UUID postId, String currentHotdropId) {

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found!"));

        User user = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> new RuntimeException("Authenticated user session data not found"));

        if (!post.getUser().getHotdropId().equals(currentHotdropId)) {
            throw new RuntimeException("Access Denied: You can only delete your own post!!");
        }

        if (post.getImages() != null && !post.getImages().isEmpty()) {
            List<UserImageHistory> archives = new ArrayList<>();

            for (PostImage img : post.getImages()) {
                if (img.getUrl() != null && !img.getUrl().isBlank()) {

                    String historyPublicId = (img.getPublicId() != null) ? img.getPublicId() : "";

                    UserImageHistory historyRecord = UserImageHistory.builder()
                            .user(user)
                            .imageUrl(img.getUrl())
                            .publicId(historyPublicId)
                            .changedAt(LocalDateTime.now())
                            .build();

                    archives.add(historyRecord);
                }
            }

            if (!archives.isEmpty()) {
                userImageHistoryRepo.saveAll(archives);
                log.info("Archived {} post image asset reference(s) to history table", archives.size());
            }
        }

        postRepo.delete(post);
        log.info("Post ID: {} successfully evicted from core layers.", postId);
    }

    @Override
    public PostListResponseDto getAllPostsCompiledFeed(int page, int size, String sortBy, String direction, String search, String currentHotdropId) {

        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        String cleanedKeyword = (search == null || search.isBlank()) ? null : search.trim();
        Page<Post> postPage = postRepo.searchFeedEngine(cleanedKeyword, pageable);

        List<PostResponseDto> postResponseDto = postPage.getContent().stream()
                .map(post -> postMapperWithID.toResponseDto(post, currentHotdropId))
                .toList();

        return PostListResponseDto.builder()
                .posts(postResponseDto)
                .pageNumber(postPage.getNumber())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .isLastPage(postPage.isLast())
                .build();
    }

    @Override
    public PostResponseDto getPostByPostId(UUID postId) {

        Post post = postRepo.findById(postId).orElse(null);
        if (post == null) {
            return null;
        }

        return postMapper.toResponseDto(post);
    }

    @Override
    @Transactional
    public PostResponseDto toggleLike(UUID postId, String hotdropId) {
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findByHotdropId(hotdropId).orElseThrow();

        Optional<Like> existingLike = likeRepo.findByUserAndPost(user, post);

        if (existingLike.isPresent()) {
            likeRepo.delete(existingLike.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));

        } else {
            likeRepo.save(Like.builder().user(user).post(post).build());
            post.setLikeCount(post.getLikeCount() + 1);
            notificationService.sendNotification(
                    user,
                    post.getUser(),
                    NotificationType.LIKE,
                    "@" + user.getHotdropId() + " liked your post '" + post.getTitle() + "'",
                    post.getId()
            );
        }

        postRepo.save(post);

        return postMapperWithID.toResponseDto(post, hotdropId);
    }

    @Override
    @Transactional
    public CommentResponseDto addCommentToPost(UUID postId, String hotdropId, String text) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException("Comment text cannot be empty");
        }

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = Comment.builder()
                .text(text.trim())
                .user(user)
                .post(post)
                .build();
        Comment savedComment = commentRepo.save(comment);

        post.setCommentCount(post.getCommentCount() + 1);

        notificationService.sendNotification(
                user,
                post.getUser(),
                NotificationType.COMMENT,
                "@" + user.getHotdropId() + " commented: " + text.trim(),
                post.getId()
        );
        postRepo.save(post);

        var userSummary = PostResponseDto.UserSummaryDto.builder()
                .id(user.getId())
                .hotdropId(user.getHotdropId())
                .profilePicture(user.getProfileImageUrl())
                .build();

        return CommentResponseDto.builder()
                .id(savedComment.getId())
                .text(savedComment.getText())
                .createdAt(savedComment.getCreatedAt())
                .user(userSummary)
                .build();
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, String hotdropId) {

        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        commentRepo.deleteCommentById(commentId);
        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = comment.getPost();
        boolean isCommentOwner = comment.getUser().getId().equals(currentUser.getId());
        boolean isPostOwner = post.getUser().getId().equals(currentUser.getId());

        if (!isCommentOwner && !isPostOwner) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }
        commentRepo.delete(comment);

        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        postRepo.save(post);
    }

    @Override
    @Transactional(readOnly = true)
    public PostListResponseDto getPostsByUserIdPaged(UUID userId, int page, int size, String currentHotdropId) {

        if (!userRepo.existsById(userId)) {
            throw new RuntimeException("Target user not found");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Post> postPage = postRepo.findByUserId(userId, pageable);

        List<PostResponseDto> postResponseDtos = postPage.getContent().stream()
                .map(post -> postMapperWithID.toResponseDto(post, currentHotdropId))
                .toList();

        return PostListResponseDto.builder()
                .posts(postResponseDtos)
                .pageNumber(postPage.getNumber())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .isLastPage(postPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponseDto getPostByShareUrl(String shareUrl, String hotdropId) {
        Post post = postRepo.findByShareUrl(shareUrl)
                .or(() -> {
                    try {
                        UUID uuid = UUID.fromString(shareUrl);
                        return postRepo.findById(uuid);
                    } catch (Exception e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Post not found with shareUrl / id: " + shareUrl));

        return postMapperWithID
                .toResponseDto(post, hotdropId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByPostId(UUID postId) {
        postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        List<Comment> comments = commentRepo.findByPostIdOrderByCreatedAtDesc(postId);

        return comments.stream()
                .map(comment -> {
                    User commenter = comment.getUser();
                    var userSummary = PostResponseDto.UserSummaryDto.builder()
                            .id(commenter.getId())
                            .hotdropId(commenter.getHotdropId())
                            .profilePicture(commenter.getProfileImageUrl())
                            .build();

                    return CommentResponseDto.builder()
                            .id(comment.getId())
                            .text(comment.getText())
                            .createdAt(comment.getCreatedAt())
                            .user(userSummary)
                            .build();
                })
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<PostResponseDto.UserSummaryDto> getUsersWhoLikedPost(UUID postId) {
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        List<Like> likes = likeRepo.findByPost(post);

        return likes.stream()
                .map(like -> {
                    User user = like.getUser();
                    return PostResponseDto.UserSummaryDto.builder()
                            .id(user.getId())
                            .hotdropId(user.getHotdropId())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .profilePicture(user.getProfileImageUrl())
                            .build();
                })
                .toList();
    }
}
