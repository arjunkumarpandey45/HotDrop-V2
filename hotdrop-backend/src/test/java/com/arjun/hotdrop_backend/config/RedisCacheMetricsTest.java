package com.arjun.hotdrop_backend.config;

import io.micrometer.core.instrument.FunctionCounter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.cache.RedisCache;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.data.redis.url=redis://localhost:6379"
})
class RedisCacheMetricsTest {

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private MeterRegistry meterRegistry;

    @Test
    @DisplayName("Verify RedisCacheManager is instrumented with statistics and initial cache names")
    void testCacheManagerConfiguration() {
        assertThat(cacheManager).isInstanceOf(RedisCacheManager.class);

        assertThat(cacheManager.getCacheNames())
                .containsAll(RedisConfig.CACHE_NAMES);
    }

    @Test
    @DisplayName("Verify cache metrics are registered in MeterRegistry and record hit, miss, and put counts")
    void testCacheMetricsRecording() {
        Cache cache = cacheManager.getCache("compiledFeed");
        assertThat(cache).isNotNull().isInstanceOf(RedisCache.class);

        List<String> cacheMeters = meterRegistry.getMeters().stream()
                .map(m -> m.getId().getName())
                .filter(name -> name.startsWith("cache"))
                .distinct()
                .toList();

        assertThat(cacheMeters).contains(
                "cache.gets",
                "cache.puts",
                "cache.removals"
        );

        // Record a miss
        cache.get("metrics-test-key-1");

        // Record a put
        cache.put("metrics-test-key-1", "metrics-test-val");

        // Record a hit
        cache.get("metrics-test-key-1");

        // Record an eviction / removal
        cache.evict("metrics-test-key-1");

        RedisCache redisCache = (RedisCache) cache;
        assertThat(redisCache.getStatistics().getHits()).isGreaterThanOrEqualTo(1);
        assertThat(redisCache.getStatistics().getMisses()).isGreaterThanOrEqualTo(1);
        assertThat(redisCache.getStatistics().getPuts()).isGreaterThanOrEqualTo(1);
        assertThat(redisCache.getStatistics().getDeletes()).isGreaterThanOrEqualTo(1);
    }
}
