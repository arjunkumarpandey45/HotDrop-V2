package com.arjun.hotdrop_backend.scheduler;

import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupScheduler {

    private final RefreshTokenRepo refreshTokenRepo;


    @Scheduled(fixedDelay = 600000)
    @Transactional
    public void cleanExpiredTokens() {
        log.info("Starting scheduled cleanup of expired refresh tokens...");
        try {
            int deletedTokens = refreshTokenRepo.deleteByExpiryDateBefore();
            log.info("Completed token cleanup. Successfully removed {} expired refresh tokens.", deletedTokens);
        } catch (Exception e) {
            log.error("Failed to run scheduled token cleanup", e);
        }
    }
}