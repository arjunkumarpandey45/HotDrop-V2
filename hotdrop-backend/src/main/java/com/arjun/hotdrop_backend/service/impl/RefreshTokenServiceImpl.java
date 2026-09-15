package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.RefreshTokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {
    @Value("${app.jwt.refresh-expiration-ms}")
    private Long refreshExpirationMs;

    private final RefreshTokenRepo refreshTokenRepo;
    private final UserRepo userRepo;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(String hotdropId) {
        log.info("Creating refresh token for user: {}", hotdropId);
        var user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("Failed to create refresh token: user not found for {}", hotdropId);
                    return new RuntimeException("User not found: " + hotdropId);
                });

        refreshTokenRepo.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .build();

        RefreshToken savedToken = refreshTokenRepo.save(refreshToken);
        log.info("Refresh token created successfully for user: {}", hotdropId);
        return savedToken;
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        log.info("Checking refresh token expiration for user: {}", token.getUser().getHotdropId());
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepo.delete(token);
            log.error("Refresh token has expired for user: {}. Please log in again.", token.getUser().getHotdropId());
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        log.info("Refresh token is valid for user: {}", token.getUser().getHotdropId());
        return token;
    }
}
