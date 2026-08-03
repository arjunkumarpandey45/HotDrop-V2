package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.RefreshTokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

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
        var user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> new RuntimeException("User not found: " + hotdropId));


        refreshTokenRepo.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .build();

        return refreshTokenRepo.save(refreshToken);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepo.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }
}
