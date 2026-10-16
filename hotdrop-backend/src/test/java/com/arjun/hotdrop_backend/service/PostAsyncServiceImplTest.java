package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.service.impl.PostAsyncServiceImpl;
import com.arjun.hotdrop_backend.utils.RedisEvictionHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostAsyncServiceImplTest {

    @Mock
    private TechStackDetectorService techStackDetectorService;

    @Mock
    private PostRepo postRepo;

    @Mock
    private RedisEvictionHelper redisEvictionHelper;

    @InjectMocks
    private PostAsyncServiceImpl postAsyncService;

    private UUID postId;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        postId = UUID.randomUUID();
        sampleUser = User.builder().id(UUID.randomUUID()).hotdropId("test_dev").build();
    }

    @Test
    @DisplayName("Should return immediately when projectUrl is null or blank")
    void processTechStackAndStatusAsync_NullOrBlankUrl_ReturnsEarly() {
        postAsyncService.processTechStackAndStatusAsync(postId, null);
        postAsyncService.processTechStackAndStatusAsync(postId, "   ");

        verifyNoInteractions(techStackDetectorService);
        verifyNoInteractions(postRepo);
        verifyNoInteractions(redisEvictionHelper);
    }

    @Test
    @DisplayName("Should return immediately when no technologies are detected")
    void processTechStackAndStatusAsync_NoTagsDetected_ReturnsEarly() {
        when(techStackDetectorService.detectTechStack("https://mysite.com")).thenReturn(Collections.emptySet());

        postAsyncService.processTechStackAndStatusAsync(postId, "https://mysite.com");

        verify(techStackDetectorService).detectTechStack("https://mysite.com");
        verifyNoInteractions(postRepo);
        verifyNoInteractions(redisEvictionHelper);
    }

    @Test
    @DisplayName("Should return immediately when post is not found in repository")
    void processTechStackAndStatusAsync_PostNotFound_ReturnsEarly() {
        when(techStackDetectorService.detectTechStack("https://mysite.com")).thenReturn(Set.of("React", "Vite"));
        when(postRepo.findById(postId)).thenReturn(Optional.empty());

        postAsyncService.processTechStackAndStatusAsync(postId, "https://mysite.com");

        verify(postRepo, never()).save(any(Post.class));
        verifyNoInteractions(redisEvictionHelper);
    }

    @Test
    @DisplayName("Should successfully detect tech stack, update post tags, and evict associated caches")
    void processTechStackAndStatusAsync_Success() {
        when(techStackDetectorService.detectTechStack("https://mysite.com")).thenReturn(Set.of("React", "Spring Boot"));

        Post post = Post.builder()
                .id(postId)
                .title("My App")
                .shareUrl("my-app-slug")
                .tags(new ArrayList<>(List.of("java")))
                .user(sampleUser)
                .build();
        when(postRepo.findById(postId)).thenReturn(Optional.of(post));
        when(postRepo.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        postAsyncService.processTechStackAndStatusAsync(postId, "https://mysite.com");

        assertThat(post.getTags()).contains("java", "react", "spring boot");
        verify(postRepo).save(post);
        verify(redisEvictionHelper).evictCacheEntryExact("postDetails", postId.toString());
        verify(redisEvictionHelper).evictCacheEntriesByPrefix("postByShareUrl", "url:my-app-slug");
        verify(redisEvictionHelper).evictCacheEntriesByPrefix("userPostsPaged", "user:" + sampleUser.getId());
        verify(redisEvictionHelper).evictEntireCache("compiledFeed");
    }

    @Test
    @DisplayName("Should catch unexpected exception and not rethrow")
    void processTechStackAndStatusAsync_Exception_HandledGracefully() {
        when(techStackDetectorService.detectTechStack("https://mysite.com"))
                .thenThrow(new RuntimeException("Detection service error"));

        // Should not throw
        postAsyncService.processTechStackAndStatusAsync(postId, "https://mysite.com");

        verify(postRepo, never()).save(any(Post.class));
    }
}
