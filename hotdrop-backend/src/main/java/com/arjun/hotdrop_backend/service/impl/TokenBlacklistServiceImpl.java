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
        if (remainingExpiryMillis <= 0) return;

        String key = BLACKLIST_PREFIX + token;
        redisTemplate.opsForValue().set(key, "blacklisted", Duration.ofMillis(remainingExpiryMillis));
        log.info("JWT Token blacklisted in Redis for {} ms", remainingExpiryMillis);
    }
    public boolean isTokenBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        return redisTemplate.hasKey(key);
    }
}
