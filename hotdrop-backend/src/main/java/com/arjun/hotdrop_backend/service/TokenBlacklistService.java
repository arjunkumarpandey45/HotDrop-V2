package com.arjun.hotdrop_backend.service;

public interface TokenBlacklistService {
    void blacklistToken(String token, long remainingExpiryMillis);
    boolean isTokenBlacklisted(String token);
}
