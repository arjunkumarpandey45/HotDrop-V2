package com.arjun.hotdrop_backend.service;

import io.github.bucket4j.Bucket;

public interface RateLimiterService {
    public Bucket createNewBucket();
    public Bucket resolveBucket(String key);
    public boolean tryConsume(String key);
}
