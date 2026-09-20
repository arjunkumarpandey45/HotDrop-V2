package com.arjun.hotdrop_backend.service;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;

import java.util.function.Supplier;

public interface RateLimiterService {
    Supplier<BucketConfiguration> getConfiguration(int capacity, int refillTokens, int durationSeconds);

    public boolean tryConsume(String key);

    boolean tryConsume(String key, int capacity, int refillTokens, int durationSeconds);
}
