package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.UserCleanupService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCleanupServiceImpl implements UserCleanupService {

    private final UserRepo userRepo;

    @Override
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanExpiredUnverifiedUsers() {
        log.info("Starting background cleanup for unverified users...");

        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(15);

        int deletedCount = userRepo.deleteUnverifiedUsersOlderThan(cutoffTime);

        if (deletedCount > 0) {
            log.info("Successfully cleaned up {} expired unverified user(s) from database.", deletedCount);
        } else {
            log.info("No expired unverified users found.");
        }
    }
}
