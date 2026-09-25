package com.arjun.hotdrop_backend.utils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisEvictionHelper {

    private final RedisTemplate<String, String> redisTemplate;

    public void evictCacheEntriesByPrefix(String cacheName, String keyPrefix) {
        String pattern = cacheName + "::" + keyPrefix + "*";
        try {
            Set<String> keysToDelete = new HashSet<>();
            redisTemplate.execute((org.springframework.data.redis.connection.RedisConnection connection) -> {
                try (Cursor<byte[]> cursor = connection.scan(ScanOptions.scanOptions().match(pattern).count(100).build())) {
                    while (cursor.hasNext()) {
                        keysToDelete.add(new String(cursor.next(), StandardCharsets.UTF_8));
                    }
                } catch (Exception e) {
                    log.error("Error scanning Redis keys for pattern: {}", pattern, e);
                }
                return null;
            });

            if (!keysToDelete.isEmpty()) {
                redisTemplate.unlink(keysToDelete);
                log.debug("Evicted {} keys matching pattern: {}", keysToDelete.size(), pattern);
            } else {
                log.debug("No keys found for eviction pattern: {}", pattern);
            }
        } catch (Exception e) {
            log.error("Failed to evict cache entries by prefix: {}", pattern, e);
        }
    }

    public void evictCacheEntryExact(String cacheName, String exactKey) {
        String key = cacheName + "::" + exactKey;
        try {
            redisTemplate.unlink(key);
            log.debug("Evicted cache entry: {}", key);
        } catch (Exception e) {
            log.error("Failed to evict cache entry: {}", key, e);
        }
    }

    public void evictEntireCache(String cacheName) {
        evictCacheEntriesByPrefix(cacheName, "");
    }
}
