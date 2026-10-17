package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.PostListResponseDto;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.LikeRepo;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.utils.RedisEvictionHelper;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.data.redis.url=redis://localhost:6379"
})

class CompiledFeedCacheIntegrationTest {

    @Autowired
    private PostService postService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private RedisEvictionHelper redisEvictionHelper;

    @Autowired
    private MeterRegistry meterRegistry;

    @MockitoBean
    private PostRepo postRepo;

    @MockitoBean
    private UserRepo userRepo;

    @MockitoBean
    private LikeRepo likeRepo;

    private User sampleUser;
    private Post samplePost;

    @BeforeEach
    void setUp() {
        redisEvictionHelper.evictEntireCache("compiledFeed");

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("author_dev")
                .firstName("Author")
                .lastName("Dev")
                .email("author@dev.com")
                .build();

        samplePost = Post.builder()
                .id(UUID.randomUUID())
                .title("Cache Test Post")
                .description("Verifying compiled feed caching behavior")
                .projectUrl("https://cachetest.com")
                .shareUrl("cache-test-slug")
                .user(sampleUser)
                .likeCount(5)
                .commentCount(2)
                .shareCount(1)
                .createdAt(LocalDateTime.now())
                .tags(new ArrayList<>(List.of("Java", "Redis")))
                .images(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Verify cache hit on identical request, and cache miss on different parameters or viewers")
    void testCompiledFeedCacheHitAndMiss() {
        PageImpl<Post> page = new PageImpl<>(List.of(samplePost));
        when(postRepo.searchFeedEngine(any(), any(Pageable.class))).thenReturn(page);
        when(userRepo.findByHotdropId(anyString())).thenReturn(Optional.of(sampleUser));
        when(likeRepo.existsByUserAndPost(any(User.class), any(Post.class))).thenReturn(false);

        // 1. First call: Cache miss -> calls DB repository
        PostListResponseDto firstResponse = postService.getAllPostsCompiledFeed(
                0, 10, "createdAt", "DESC", null, "viewerA"
        );
        assertThat(firstResponse).isNotNull();
        assertThat(firstResponse.getPosts()).hasSize(1);
        assertThat(firstResponse.getPosts().get(0).getTitle()).isEqualTo("Cache Test Post");
        verify(postRepo, times(1)).searchFeedEngine(any(), any(Pageable.class));

        // 2. Second call with IDENTICAL parameters: Cache hit -> returns cached DTO WITHOUT calling repository
        PostListResponseDto secondResponse = postService.getAllPostsCompiledFeed(
                0, 10, "createdAt", "DESC", null, "viewerA"
        );
        assertThat(secondResponse).isNotNull();
        assertThat(secondResponse.getPosts()).hasSize(1);
        assertThat(secondResponse.getPosts().get(0).getTitle()).isEqualTo("Cache Test Post");
        // Verify postRepo was NOT called a second time
        verify(postRepo, times(1)).searchFeedEngine(any(), any(Pageable.class));

        // Verify deserialization fidelity
        assertThat(secondResponse.getPageNumber()).isEqualTo(firstResponse.getPageNumber());
        assertThat(secondResponse.getTotalElements()).isEqualTo(firstResponse.getTotalElements());

        // 3. Third call with DIFFERENT viewer: Cache miss -> must call DB repository
        PostListResponseDto viewerBResponse = postService.getAllPostsCompiledFeed(
                0, 10, "createdAt", "DESC", null, "viewerB"
        );
        assertThat(viewerBResponse).isNotNull();
        verify(postRepo, times(2)).searchFeedEngine(any(), any(Pageable.class));

        // 4. Fourth call with DIFFERENT page: Cache miss -> must call DB repository
        PostListResponseDto page1Response = postService.getAllPostsCompiledFeed(
                1, 10, "createdAt", "DESC", null, "viewerA"
        );
        assertThat(page1Response).isNotNull();
        verify(postRepo, times(3)).searchFeedEngine(any(), any(Pageable.class));

        // 5. Fifth call with DIFFERENT search term: Cache miss -> must call DB repository
        PostListResponseDto searchResponse = postService.getAllPostsCompiledFeed(
                0, 10, "createdAt", "DESC", "spring", "viewerA"
        );
        assertThat(searchResponse).isNotNull();
        verify(postRepo, times(4)).searchFeedEngine(any(), any(Pageable.class));

        // 6. Eviction test: evict entire compiledFeed cache
        redisEvictionHelper.evictEntireCache("compiledFeed");

        // Next call with viewerA parameters: Cache miss -> calls DB repository again
        PostListResponseDto postEvictionResponse = postService.getAllPostsCompiledFeed(
                0, 10, "createdAt", "DESC", null, "viewerA"
        );
        assertThat(postEvictionResponse).isNotNull();
        verify(postRepo, times(5)).searchFeedEngine(any(), any(Pageable.class));
    }
}
