package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.PostImage;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.PostRepo;

import com.arjun.hotdrop_backend.repository.UserRepo;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {
    private final UserRepo userRepo;
    private final PostRepo postRepo;
    private final CloudinaryService cloudinaryService;
    private final List<String> userAgents;
    private final Random random;


    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

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
            // Handles connection timeouts, handshake failures seamlessly
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
        String uniqueShareUrl = SlugifyUtil.generateSlug(dto.getTitle());

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
            Map<String, String> cloudMeta = cloudinaryService.uploadImage(file);

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


        return mapToResponseDto(savedPost);
    }

    private PostResponseDto mapToResponseDto(Post post) {
        List<String> urls = post.getImages().stream()
                .map(PostImage::getUrl)
                .collect(Collectors.toList());

        PostResponseDto.UserSummaryDto userSummary = PostResponseDto.UserSummaryDto.builder()
                .id(post.getUser().getId())
                .hotdropId(post.getUser().getHotdropId())

                .profilePicture(post.getUser().getProfileImageUrl())
                .build();

        return PostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .projectUrl(post.getProjectUrl())
                .shareUrl(post.getShareUrl())
                .isLinkDead(post.isLinkDead())
                .createdAt(post.getCreatedAt())
                .tags(post.getTags())
                .imageUrls(urls)
                .creator(userSummary)
                .build();
    }

    @Transactional
    public void deleteExistingPost(UUID postId, String currentHotdropId) {

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found!"));


        if (!post.getUser().getHotdropId().equals(currentHotdropId)) {
            throw new RuntimeException("You can only delete your post!!");
        }


        if (post.getImages() != null) {
            for (PostImage img : post.getImages()) {
                cloudinaryService.deleteImage(img.getPublicId());
            }
        }


        postRepo.delete(post);
        log.info("Post ID: {} successfully evicted from core layers.", postId);
    }

    public PostListResponseDto getAllPostsCompiledFeed(int page, int size, String sortBy, String direction, String search) {

        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);


        String cleanedKeyword = (search == null || search.isBlank()) ? null : search.trim();
        Page<Post> postPage = postRepo.searchFeedEngine(cleanedKeyword, pageable);


        List<PostResponseDto> postResponseDtos = postPage.getContent().stream()
                .map(this::mapToResponseDto)
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


}