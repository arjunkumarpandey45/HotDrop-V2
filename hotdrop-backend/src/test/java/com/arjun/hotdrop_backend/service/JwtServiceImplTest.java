package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.service.impl.JwtServiceImpl;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceImplTest {

    private JwtServiceImpl jwtService;

    // 256-bit key encoded in Base64
    private static final String TEST_SECRET = Base64.getEncoder().encodeToString(
            "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8)
    );
    private static final long JWT_EXPIRATION_MS = 3600000L; // 1 hour
    private static final long EMAIL_EXPIRATION_MS = 900000L; // 15 minutes

    @BeforeEach
    void setUp() {
        jwtService = new JwtServiceImpl();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", JWT_EXPIRATION_MS);
        ReflectionTestUtils.setField(jwtService, "emailTokenExpirationMs", EMAIL_EXPIRATION_MS);
    }

    @Nested
    @DisplayName("Access Token Tests")
    class AccessTokenTests {

        @Test
        @DisplayName("Should successfully generate and extract hotdropId from access token")
        void generateTokenFromHotdropId_Success() {
            String token = jwtService.generateTokenFromHotdropId("test_dev");

            assertThat(token).isNotBlank();
            String extractedId = jwtService.extractHotdropId(token);
            assertThat(extractedId).isEqualTo("test_dev");
        }

        @Test
        @DisplayName("Should generate access token from Authentication object")
        void generateToken_FromAuthentication_Success() {
            UserDetails userDetails = new User("auth_user", "password", Collections.emptyList());
            Authentication authentication = mock(Authentication.class);
            when(authentication.getPrincipal()).thenReturn(userDetails);

            String token = jwtService.generateToken(authentication);

            assertThat(token).isNotBlank();
            assertThat(jwtService.extractHotdropId(token)).isEqualTo("auth_user");
        }

        @Test
        @DisplayName("validateJwtToken should return true for valid access token")
        void validateJwtToken_ValidToken_ReturnsTrue() {
            String token = jwtService.generateTokenFromHotdropId("test_dev");

            boolean isValid = jwtService.validateJwtToken(token);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("validateJwtToken should return false for invalid, expired, or malformed token")
        void validateJwtToken_InvalidToken_ReturnsFalse() {
            assertThat(jwtService.validateJwtToken("invalid.token.structure")).isFalse();
            assertThat(jwtService.validateJwtToken("")).isFalse();
        }

        @Test
        @DisplayName("validateJwtToken should return false when token has wrong purpose")
        void validateJwtToken_EmailVerificationToken_ReturnsFalse() {
            String emailToken = jwtService.generateEmailVerificationToken("test@hotdrop.io");

            boolean isValid = jwtService.validateJwtToken(emailToken);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("extractHotdropId should throw JwtException when given an email verification token")
        void extractHotdropId_WrongPurpose_ThrowsJwtException() {
            String emailToken = jwtService.generateEmailVerificationToken("test@hotdrop.io");

            assertThatThrownBy(() -> jwtService.extractHotdropId(emailToken))
                    .isInstanceOf(JwtException.class)
                    .hasMessageContaining("Token is not a valid access token");
        }
    }

    @Nested
    @DisplayName("Email Verification Token Tests")
    class EmailVerificationTokenTests {

        @Test
        @DisplayName("Should successfully generate and extract email from verification token")
        void generateEmailVerificationToken_Success() {
            String email = "test@hotdrop.io";
            String token = jwtService.generateEmailVerificationToken(email);

            assertThat(token).isNotBlank();
            assertThat(jwtService.getEmailFromToken(token)).isEqualTo(email);
        }

        @Test
        @DisplayName("validateEmailToken should return true for valid verification token")
        void validateEmailToken_ValidToken_ReturnsTrue() {
            String token = jwtService.generateEmailVerificationToken("test@hotdrop.io");

            boolean isValid = jwtService.validateEmailToken(token);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("validateEmailToken should return false for access token")
        void validateEmailToken_AccessToken_ReturnsFalse() {
            String accessToken = jwtService.generateTokenFromHotdropId("test_dev");

            boolean isValid = jwtService.validateEmailToken(accessToken);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("validateEmailToken should return false for malformed token")
        void validateEmailToken_MalformedToken_ReturnsFalse() {
            assertThat(jwtService.validateEmailToken("not_a_valid_jwt")).isFalse();
        }

        @Test
        @DisplayName("getEmailFromToken should throw JwtException when given an access token")
        void getEmailFromToken_WrongPurpose_ThrowsJwtException() {
            String accessToken = jwtService.generateTokenFromHotdropId("test_dev");

            assertThatThrownBy(() -> jwtService.getEmailFromToken(accessToken))
                    .isInstanceOf(JwtException.class)
                    .hasMessageContaining("Token is not an email verification token");
        }
    }

    @Nested
    @DisplayName("Token Expiration Time Tests")
    class TokenExpirationTimeTests {

        @Test
        @DisplayName("Should return positive remaining time for newly generated token")
        void getRemainingExpirationTime_ValidToken_ReturnsPositiveTtl() {
            String token = jwtService.generateTokenFromHotdropId("test_dev");

            long remainingTime = jwtService.getRemainingExpirationTime(token);

            assertThat(remainingTime).isGreaterThan(0L).isLessThanOrEqualTo(JWT_EXPIRATION_MS);
        }

        @Test
        @DisplayName("Should return 0 for expired token")
        void getRemainingExpirationTime_ExpiredToken_ReturnsZero() {
            // Setup service with negative expiration to simulate immediate expiry
            JwtServiceImpl expiredJwtService = new JwtServiceImpl();
            ReflectionTestUtils.setField(expiredJwtService, "secretKey", TEST_SECRET);
            ReflectionTestUtils.setField(expiredJwtService, "jwtExpirationMs", -1000L);

            String expiredToken = expiredJwtService.generateTokenFromHotdropId("test_dev");

            long remainingTime = expiredJwtService.getRemainingExpirationTime(expiredToken);

            assertThat(remainingTime).isZero();
        }

        @Test
        @DisplayName("Should return 0 for malformed token")
        void getRemainingExpirationTime_MalformedToken_ReturnsZero() {
            long remainingTime = jwtService.getRemainingExpirationTime("invalid_token");

            assertThat(remainingTime).isZero();
        }
    }
}
