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
import com.arjun.hotdrop_backend.service.TechStackDetectorService;
import com.arjun.hotdrop_backend.utils.SlugifyUtil;
import com.arjun.hotdrop_backend.utils.UserAgentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    private final TechStackDetectorService techStackDetectorService;
    private final UserAgentProvider userAgentProvider;
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
        log.info("Verifying project link: {}", inputUrl);
        if (inputUrl == null || inputUrl.isBlank()) {
            log.error("Link verification failed: URL is empty");
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

        String randomUA = userAgentProvider.getRandomUserAgent();

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
                Set<String> detectedTags = techStackDetectorService.detectTechStack(cleanUrl);
                log.info("Project link {} is live (verified with HEAD request)", cleanUrl);
                return LinkVerificationResponseDto.builder()
                        .isLive(true)
                        .url(cleanUrl)
                        .message("Link is live! 🔥 (Verified via HEAD)")
                        .detectedTags(new ArrayList<>(detectedTags))
                        .build();
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("HEAD verification was interrupted for link: {}", cleanUrl);
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
                Set<String> detectedTags = techStackDetectorService.detectTechStack(cleanUrl);
                log.info("Project link {} is live (verified with GET request)", cleanUrl);
                return LinkVerificationResponseDto.builder()
                        .isLive(true)
                        .url(cleanUrl)
                        .message("Link is Live! 🔥 (Verified via GET)")
                        .detectedTags(new ArrayList<>(detectedTags))
                        .build();
            }

            log.error("Project link {} returned unhealthy HTTP status: {}", cleanUrl, getResponse.statusCode());
            return LinkVerificationResponseDto.builder()
                    .isLive(false)
                    .url(cleanUrl)
                    .message("Link returned bad status code: " + getResponse.statusCode())
                    .detectedTags(Collections.emptyList())
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("GET verification was interrupted for link: {}", cleanUrl);
        } catch (Exception e) {
            log.error("Project link verification failed for {}: {}", cleanUrl, e.getMessage());
        }

        log.error("Project link {} is dead or unreachable", cleanUrl);
        return LinkVerificationResponseDto.builder()
                .isLive(false)
                .url(cleanUrl)
                .message("Link is dead or completely unreachable.")
                .detectedTags(Collections.emptyList())
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
    @CacheEvict(value = "compiledFeed", allEntries = true)
    public PostResponseDto createNewPost(CreatePostDto dto, MultipartFile[] files, String hotdropId) {
        log.info("Creating new post with title: '{}' for user: {}", dto.getTitle(), hotdropId);

        if (files == null || files.length == 0 || files[0].isEmpty()) {
            log.error("Failed to create post: no images uploaded");
            throw new RuntimeException("At least 1 image must be uploaded.");
        }
        User authenticatedUser = userRepo.findByHotdropId(String.valueOf(hotdropId))
                .orElseThrow(() -> {
                    log.error("Failed to create post: user not found with hotdropId: {}", hotdropId);
                    return new RuntimeException("User not found ");
                });

        String cleanTitle = sanitizeInput(dto.getTitle());
        String cleanDescription = sanitizeInput(dto.getDescription());
        String cleanProjectUrl = sanitizeInput(dto.getProjectUrl());
        String uniqueShareUrl = SlugifyUtil.generateSlug(dto.getTitle()) + "-" + System.currentTimeMillis();
        Set<String> finalTagsSet = new LinkedHashSet<>();
        if (dto.getTags() != null && !dto.getTags().isBlank()) {
            Arrays.stream(dto.getTags().split(","))
                    .map(tag -> sanitizeInput(tag.trim().toLowerCase()))
                    .filter(tag -> !tag.isEmpty())
                    .forEach(finalTagsSet::add);
        }
        if (cleanProjectUrl != null && !cleanProjectUrl.isBlank()) {
            try {
                Set<String> autoTags = techStackDetectorService.detectTechStack(cleanProjectUrl);
                autoTags.stream()
                        .map(tag -> sanitizeInput(tag.trim().toLowerCase()))
                        .filter(tag -> !tag.isEmpty())
                        .forEach(finalTagsSet::add);
            } catch (Exception e) {
                log.warn("Could not detect tech stack during post creation: {}", e.getMessage());
            }
        }
        List<String> cleanedTags = new ArrayList<>(finalTagsSet);
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
        log.info("Post created successfully! Post ID: {}, Title: '{}'", savedPost.getId(), savedPost.getTitle());

        return postMapper.toResponseDto(savedPost);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {"compiledFeed", "postDetails", "postByShareUrl", "userPostsPaged"},
            allEntries = true
    )
    public void deleteExistingPost(UUID postId, String currentHotdropId) {
        log.info("Deleting post ID: {} requested by user: {}", postId, currentHotdropId);

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> {
                    log.error("Failed to delete post: post not found with ID: {}", postId);
                    return new RuntimeException("Post not found!");
                });

        User user = userRepo.findByHotdropId(currentHotdropId)
                .orElseThrow(() -> {
                    log.error("Failed to delete post: user not found with hotdropId: {}", currentHotdropId);
                    return new RuntimeException("Authenticated user session data not found");
                });

        if (!post.getUser().getHotdropId().equals(currentHotdropId)) {
            log.error("Unauthorized: user {} tried to delete post {} owned by {}", currentHotdropId, postId, post.getUser().getHotdropId());
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
                log.info("Archived {} image(s) for deleted post ID: {}", archives.size(), postId);
            }
        }

        postRepo.delete(post);
        log.info("Post ID: {} successfully deleted by user: {}", postId, currentHotdropId);
    }

    @Override
    @Cacheable(
            value = "compiledFeed",
            key = "{#page, #size, #sortBy, #direction, #search, #currentHotdropId}",
            unless = "#result == null"
    )
    public PostListResponseDto getAllPostsCompiledFeed(int page, int size, String sortBy, String direction, String search, String currentHotdropId) {
        log.info("Fetching compiled feed: page={}, size={}, sortBy={}, direction={}, search='{}'", page, size, sortBy, direction, search);

        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        String cleanedKeyword = (search == null || search.isBlank()) ? null : search.trim();
        Page<Post> postPage = postRepo.searchFeedEngine(cleanedKeyword, pageable);

        List<PostResponseDto> postResponseDto = postPage.getContent().stream()
                .map(post -> postMapperWithID.toResponseDto(post, currentHotdropId))
                .toList();

        log.info("Compiled feed successfully with {} posts", postResponseDto.size());

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
    @Cacheable(value = "postDetails", key = "#postId", unless = "#result == null")
    public PostResponseDto getPostByPostId(UUID postId) {
        log.info("Fetching post by ID: {}", postId);

        Post post = postRepo.findById(postId).orElse(null);
        if (post == null) {
            log.error("Post not found with ID: {}", postId);
            return null;
        }

        log.info("Found post '{}' with ID: {}", post.getTitle(), postId);
        return postMapper.toResponseDto(post);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {"compiledFeed", "postDetails", "postByShareUrl", "userPostsPaged"},
            allEntries = true
    )
    public PostResponseDto toggleLike(UUID postId, String hotdropId) {
        log.info("User {} toggling like on post ID: {}", hotdropId, postId);

        Post post = postRepo.findById(postId).orElseThrow(() -> {
            log.error("Failed to toggle like: post not found with ID: {}", postId);
            return new RuntimeException("Post not found");
        });

        User user = userRepo.findByHotdropId(hotdropId).orElseThrow(() -> {
            log.error("Failed to toggle like: user not found with hotdropId: {}", hotdropId);
            return new RuntimeException("User not found");
        });

        Optional<Like> existingLike = likeRepo.findByUserAndPost(user, post);

        if (existingLike.isPresent()) {
            likeRepo.delete(existingLike.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            log.info("User {} unliked post ID: {}. Current likes: {}", hotdropId, postId, post.getLikeCount());
        } else {
            likeRepo.save(Like.builder().user(user).post(post).build());
            post.setLikeCount(post.getLikeCount() + 1);
            notificationService.sendNotification(
                    user,
                    post.getUser(),
                    NotificationType.LIKE,
                    " liked your post '" + post.getTitle() + "'",
                    post.getId()
            );
            log.info("User {} liked post ID: {}. Current likes: {}", hotdropId, postId, post.getLikeCount());
        }

        postRepo.save(post);

        return postMapperWithID.toResponseDto(post, hotdropId);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {"postComments", "compiledFeed", "postDetails", "postByShareUrl"},
            allEntries = true
    )
    public CommentResponseDto addCommentToPost(UUID postId, String hotdropId, String text) {
        log.info("Adding comment to post ID: {} by user: {}", postId, hotdropId);

        if (text == null || text.isBlank()) {
            log.error("Failed to add comment: comment text is empty");
            throw new RuntimeException("Comment text cannot be empty");
        }

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> {
                    log.error("Failed to add comment: post not found with ID: {}", postId);
                    return new RuntimeException("Post not found");
                });

        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("Failed to add comment: user not found with hotdropId: {}", hotdropId);
                    return new RuntimeException("User not found");
                });

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
                " commented: " + text.trim(),
                post.getId()
        );
        postRepo.save(post);
        log.info("Comment successfully added to post ID: {} by user: {}. Current comments: {}", postId, hotdropId, post.getCommentCount());

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
    @CacheEvict(
            value = {"postComments", "compiledFeed", "postDetails", "postByShareUrl"},
            allEntries = true
    )
    public void deleteComment(UUID commentId, String hotdropId) {
        log.info("Deleting comment ID: {} requested by user: {}", commentId, hotdropId);

        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> {
                    log.error("Failed to delete comment: comment not found with ID: {}", commentId);
                    return new RuntimeException("Comment not found");
                });
        commentRepo.deleteCommentById(commentId);
        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("Failed to delete comment: user not found with hotdropId: {}", hotdropId);
                    return new RuntimeException("User not found");
                });
        Post post = comment.getPost();
        boolean isCommentOwner = comment.getUser().getId().equals(currentUser.getId());
        boolean isPostOwner = post.getUser().getId().equals(currentUser.getId());

        if (!isCommentOwner && !isPostOwner) {
            log.error("Unauthorized: user {} is neither the author of the comment nor the post owner", hotdropId);
            throw new RuntimeException("You are not authorized to delete this comment");
        }
        commentRepo.delete(comment);

        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        postRepo.save(post);
        log.info("Comment ID: {} deleted successfully by user: {}", commentId, hotdropId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "userPostsPaged",
            key = "{#userId, #page, #size, #currentHotdropId}",
            unless = "#result == null"
    )
    public PostListResponseDto getPostsByUserIdPaged(UUID userId, int page, int size, String currentHotdropId) {
        log.info("Fetching posts created by user ID: {}, page: {}, size: {}", userId, page, size);

        if (!userRepo.existsById(userId)) {
            log.error("Failed to fetch posts: target user not found with ID: {}", userId);
            throw new RuntimeException("Target user not found");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> postPage = postRepo.findByUserId(userId, pageable);

        List<PostResponseDto> postResponseDtos = postPage.getContent().stream()
                .map(post -> postMapperWithID.toResponseDto(post, currentHotdropId))
                .toList();

        log.info("Successfully fetched {} posts for user ID: {}", postResponseDtos.size(), userId);

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
    @Cacheable(
            value = "postByShareUrl",
            key = "{#shareUrl, #hotdropId}",
            unless = "#result == null"
    )
    public PostResponseDto getPostByShareUrl(String shareUrl, String hotdropId) {
        log.info("Fetching post by share URL: '{}'", shareUrl);

        Post post = postRepo.findByShareUrl(shareUrl)
                .or(() -> {
                    try {
                        UUID uuid = UUID.fromString(shareUrl);
                        return postRepo.findById(uuid);
                    } catch (Exception e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> {
                    log.error("Post not found with shareUrl / ID: '{}'", shareUrl);
                    return new RuntimeException("Post not found with shareUrl / id: " + shareUrl);
                });

        log.info("Found post '{}' for share URL: '{}'", post.getTitle(), shareUrl);
        return postMapperWithID.toResponseDto(post, hotdropId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "postComments",
            key = "#postId",
            unless = "#result == null"
    )
    public List<CommentResponseDto> getCommentsByPostId(UUID postId) {
        log.info("Fetching comments for post ID: {}", postId);

        postRepo.findById(postId)
                .orElseThrow(() -> {
                    log.error("Failed to fetch comments: post not found with ID: {}", postId);
                    return new RuntimeException("Post not found with ID: " + postId);
                });

        List<Comment> comments = commentRepo.findByPostIdOrderByCreatedAtDesc(postId);
        log.info("Fetched {} comments for post ID: {}", comments.size(), postId);

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
        log.info("Fetching users who liked post ID: {}", postId);

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> {
                    log.error("Failed to fetch liked users: post not found with ID: {}", postId);
                    return new RuntimeException("Post not found with ID: " + postId);
                });

        List<Like> likes = likeRepo.findByPost(post);
        log.info("Fetched {} users who liked post ID: {}", likes.size(), postId);

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
