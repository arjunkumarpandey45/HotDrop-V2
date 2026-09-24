package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.RateLimiterService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterServiceImpl implements RateLimiterService {

    private final LettuceBasedProxyManager<byte[]> proxyManager;
    private static final String RATE_LIMIT_PREFIX = "rate:limit:";

    public Supplier<BucketConfiguration> getConfiguration(int capacity, int refillTokens, int durationSeconds) {
        return () -> {
            Refill refill = Refill.greedy(refillTokens, Duration.ofSeconds(durationSeconds));
            Bandwidth limit = Bandwidth.classic(capacity, refill);
            return BucketConfiguration.builder()
                    .addLimit(limit)
                    .build();
        };
    }

    @Override
    public boolean tryConsume(String key) {
        // Default fallback: 10 requests per 60 seconds
        return tryConsume(key, 10, 10, 60);
    }

    @Override
    public boolean tryConsume(String key, int capacity, int refillTokens, int durationSeconds) {
        try {
        String fullKey = RATE_LIMIT_PREFIX + key;
        byte[] redisKeyBytes = fullKey.getBytes(StandardCharsets.UTF_8);

        Supplier<BucketConfiguration> configuration = getConfiguration(capacity, refillTokens, durationSeconds);
        BucketProxy bucket = proxyManager.builder().build(redisKeyBytes, configuration);

        boolean consumed = bucket.tryConsume(1);

        if (!consumed) {
            log.warn("Rate limit breached in Redis for key: {}. Request blocked.", fullKey);
        } else {
            log.debug("Rate limit token consumed from Redis for key: {}", fullKey);
        }
        return consumed;
        }
        catch (Exception e) {

        log.error("Redis rate limiter unavailable. Failing open for key: {}", key, e);
        return true;
    }


    }
}