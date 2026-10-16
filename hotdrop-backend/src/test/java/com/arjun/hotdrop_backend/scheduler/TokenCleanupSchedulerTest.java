package com.arjun.hotdrop_backend.scheduler;

import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenCleanupSchedulerTest {

    @Mock
    private RefreshTokenRepo refreshTokenRepo;

    @InjectMocks
    private TokenCleanupScheduler tokenCleanupScheduler;

    @Test
    @DisplayName("Should successfully delete expired refresh tokens")
    void cleanExpiredTokens_Success() {
        when(refreshTokenRepo.deleteByExpiryDateBefore()).thenReturn(5);

        tokenCleanupScheduler.cleanExpiredTokens();

        verify(refreshTokenRepo).deleteByExpiryDateBefore();
    }

    @Test
    @DisplayName("Should catch exception during token cleanup and log error without throwing")
    void cleanExpiredTokens_Exception_HandledGracefully() {
        when(refreshTokenRepo.deleteByExpiryDateBefore()).thenThrow(new RuntimeException("Database timeout"));

        // Should not throw exception
        tokenCleanupScheduler.cleanExpiredTokens();

        verify(refreshTokenRepo).deleteByExpiryDateBefore();
    }
}
