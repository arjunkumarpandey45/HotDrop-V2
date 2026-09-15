package com.arjun.hotdrop_backend.service.impl;



import com.arjun.hotdrop_backend.service.RateLimiterService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RateLimiterServiceImpl implements RateLimiterService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket createNewBucket() {
        log.info("Creating a new rate-limit token bucket (limit: 5 requests per minute)");
        Refill refill = Refill.greedy(5, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(5, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    public Bucket resolveBucket(String key) {
        log.info("Resolving rate-limit bucket for key: {}", key);
        return cache.computeIfAbsent(key, k -> createNewBucket());
    }

    public boolean tryConsume(String key) {
        Bucket bucket = resolveBucket(key);
        boolean consumed = bucket.tryConsume(1);
        if (!consumed) {
            log.error("Rate limit reached for key: {}. Request blocked.", key);
        } else {
            log.info("Rate limit check passed for key: {}", key);
        }
        return consumed;
    }
}