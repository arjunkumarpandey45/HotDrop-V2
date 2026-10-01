package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;

@RequiredArgsConstructor
@Slf4j
@Service
public class TokenBlacklistServiceImpl implements TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    @Override
    public void blacklistToken(String token, long remainingExpiryMillis) {
        if (token == null || token.isBlank() || remainingExpiryMillis <= 0) {
            return;
        }

        try {
            String tokenHash = hashToken(token);
            String key = BLACKLIST_PREFIX + tokenHash;

            redisTemplate.opsForValue().set(key, "1", Duration.ofMillis(remainingExpiryMillis));
            log.info("Blacklisted token hash {} for {} ms", tokenHash.substring(0, 10) + "...", remainingExpiryMillis);
        } catch (Exception e) {
            log.error("Failed to blacklist token in Redis", e);
        }
    }

    @Override
    public boolean isTokenBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        try {
            String tokenHash = hashToken(token);
            String key = BLACKLIST_PREFIX + tokenHash;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Error checking token blacklist status in Redis. Failing open.", e);
            return false;
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {

            return Integer.toHexString(token.hashCode());
        }
    }
}