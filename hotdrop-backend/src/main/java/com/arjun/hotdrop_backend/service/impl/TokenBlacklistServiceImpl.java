package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
@RequiredArgsConstructor
@Slf4j
@Service
public class TokenBlacklistServiceImpl implements TokenBlacklistService {
    private final RedisTemplate<String, String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    public void blacklistToken(String token, long remainingExpiryMillis) {
        if (token == null || token.isBlank() || remainingExpiryMillis <= 0) {
            return;
        }
        try {
        String key = BLACKLIST_PREFIX + token;
        redisTemplate.opsForValue().set(key, "blacklisted", Duration.ofMillis(remainingExpiryMillis));
        log.info("Blocked token for {} ms.", remainingExpiryMillis);
        } catch (Exception e) {
            log.error("Failed to blacklist token in Redis: {}", e.getMessage());
        }
    }
    public boolean isTokenBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
        String key = BLACKLIST_PREFIX + token;
            return redisTemplate.hasKey(key);
        } catch (Exception e) {
            log.error("Error checking token blacklist status in Redis: {}", e.getMessage());
            return false;
        }
    }
}
