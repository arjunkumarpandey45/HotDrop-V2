package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.RefreshTokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
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
                    log.error("Cannot create refresh token: user not found for {}", hotdropId);
                    return new ResourceNotFoundException("User not found with id: " + hotdropId);
                });



        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .build();

        RefreshToken savedToken = refreshTokenRepo.save(refreshToken);
        log.info("Created refresh token for user: {}", hotdropId);
        return savedToken;
    }
    @Override
    @Transactional
    public RefreshToken verifyAndRotate(String tokenString) {
        RefreshToken refreshToken = refreshTokenRepo.findByToken(tokenString)
                .orElseThrow(() -> new BadCredentialsException("Refresh token not found or invalid."));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepo.delete(refreshToken);
            log.warn("Expired refresh token rejected for user: {}", refreshToken.getUser().getHotdropId());
            throw new BadCredentialsException("Refresh token has expired. Please login again.");
        }

        User user = refreshToken.getUser();
        refreshTokenRepo.delete(refreshToken);

        return createRefreshToken(user.getHotdropId());
    }

}
