package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.service.impl.TokenBlacklistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceImplTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private TokenBlacklistServiceImpl tokenBlacklistService;

    private String sampleToken;
    private String expectedKey;

    @BeforeEach
    void setUp() throws Exception {
        sampleToken = "sample.jwt.token.value";
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(sampleToken.getBytes(StandardCharsets.UTF_8));
        expectedKey = "jwt:blacklist:" + HexFormat.of().formatHex(hash);
    }

    @Nested
    @DisplayName("blacklistToken Tests")
    class BlacklistTokenTests {

        @Test
        @DisplayName("Should successfully store hashed token with remaining TTL in Redis")
        void blacklistToken_ValidTokenAndTtl_Success() {
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);

            tokenBlacklistService.blacklistToken(sampleToken, 300000L);

            verify(valueOperations).set(eq(expectedKey), eq("1"), eq(Duration.ofMillis(300000L)));
        }

        @Test
        @DisplayName("Should skip operation when token is null")
        void blacklistToken_NullToken_SkipsExecution() {
            tokenBlacklistService.blacklistToken(null, 300000L);

            verifyNoInteractions(redisTemplate);
        }

        @Test
        @DisplayName("Should skip operation when token is blank")
        void blacklistToken_BlankToken_SkipsExecution() {
            tokenBlacklistService.blacklistToken("   ", 300000L);

            verifyNoInteractions(redisTemplate);
        }

        @Test
        @DisplayName("Should skip operation when remainingExpiryMillis is zero or negative")
        void blacklistToken_ZeroOrNegativeTtl_SkipsExecution() {
            tokenBlacklistService.blacklistToken(sampleToken, 0L);
            tokenBlacklistService.blacklistToken(sampleToken, -5000L);

            verifyNoInteractions(redisTemplate);
        }

        @Test
        @DisplayName("Should catch Redis exception and degrade gracefully without throwing")
        void blacklistToken_RedisException_HandledGracefully() {
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            doThrow(new RuntimeException("Redis connection error"))
                    .when(valueOperations).set(anyString(), anyString(), any(Duration.class));

            // Should not throw exception
            tokenBlacklistService.blacklistToken(sampleToken, 300000L);

            verify(valueOperations).set(eq(expectedKey), eq("1"), eq(Duration.ofMillis(300000L)));
        }
    }

    @Nested
    @DisplayName("isTokenBlacklisted Tests")
    class IsTokenBlacklistedTests {

        @Test
        @DisplayName("Should return true when token key exists in Redis")
        void isTokenBlacklisted_TokenExists_ReturnsTrue() {
            when(redisTemplate.hasKey(expectedKey)).thenReturn(true);

            boolean result = tokenBlacklistService.isTokenBlacklisted(sampleToken);

            assertThat(result).isTrue();
            verify(redisTemplate).hasKey(expectedKey);
        }

        @Test
        @DisplayName("Should return false when token key does not exist in Redis")
        void isTokenBlacklisted_TokenDoesNotExist_ReturnsFalse() {
            when(redisTemplate.hasKey(expectedKey)).thenReturn(false);

            boolean result = tokenBlacklistService.isTokenBlacklisted(sampleToken);

            assertThat(result).isFalse();
            verify(redisTemplate).hasKey(expectedKey);
        }

        @Test
        @DisplayName("Should return false when token is null or blank")
        void isTokenBlacklisted_NullOrBlankToken_ReturnsFalse() {
            assertThat(tokenBlacklistService.isTokenBlacklisted(null)).isFalse();
            assertThat(tokenBlacklistService.isTokenBlacklisted("   ")).isFalse();

            verifyNoInteractions(redisTemplate);
        }

        @Test
        @DisplayName("Should fail open and return false when Redis throws exception")
        void isTokenBlacklisted_RedisThrowsException_FailsOpenReturnsFalse() {
            when(redisTemplate.hasKey(expectedKey)).thenThrow(new RuntimeException("Redis cluster unavailable"));

            boolean result = tokenBlacklistService.isTokenBlacklisted(sampleToken);

            assertThat(result).isFalse();
        }
    }
}
