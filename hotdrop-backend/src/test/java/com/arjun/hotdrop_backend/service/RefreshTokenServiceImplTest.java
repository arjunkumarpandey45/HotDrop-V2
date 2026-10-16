package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.impl.RefreshTokenServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceImplTest {

    @Mock
    private RefreshTokenRepo refreshTokenRepo;

    @Mock
    private UserRepo userRepo;

    @InjectMocks
    private RefreshTokenServiceImpl refreshTokenService;

    private User sampleUser;
    private static final long REFRESH_EXPIRATION_MS = 604800000L; // 7 days

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationMs", REFRESH_EXPIRATION_MS);

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("test_dev")
                .email("test@hotdrop.io")
                .build();
    }

    @Nested
    @DisplayName("Create Refresh Token Tests")
    class CreateRefreshTokenTests {

        @Test
        @DisplayName("Should successfully create and persist a new refresh token")
        void createRefreshToken_UserExists_Success() {
            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));
            when(refreshTokenRepo.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

            RefreshToken result = refreshTokenService.createRefreshToken("test_dev");

            assertThat(result).isNotNull();
            assertThat(result.getUser()).isEqualTo(sampleUser);
            assertThat(result.getToken()).isNotBlank();
            assertThat(result.getExpiryDate()).isAfter(Instant.now());

            ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
            verify(refreshTokenRepo).save(captor.capture());
            RefreshToken capturedToken = captor.getValue();
            assertThat(capturedToken.getUser()).isEqualTo(sampleUser);
            assertThat(capturedToken.getToken()).isEqualTo(result.getToken());
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user does not exist")
        void createRefreshToken_UserNotFound_ThrowsException() {
            when(userRepo.findByHotdropId("unknown_user")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refreshTokenService.createRefreshToken("unknown_user"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id: unknown_user");

            verify(refreshTokenRepo, never()).save(any(RefreshToken.class));
        }
    }

    @Nested
    @DisplayName("Verify And Rotate Tests")
    class VerifyAndRotateTests {

        @Test
        @DisplayName("Should rotate valid refresh token: delete old token and create new one")
        void verifyAndRotate_ValidToken_Success() {
            String oldTokenString = "old_valid_token";
            RefreshToken existingToken = RefreshToken.builder()
                    .token(oldTokenString)
                    .user(sampleUser)
                    .expiryDate(Instant.now().plusSeconds(3600))
                    .build();

            when(refreshTokenRepo.findByToken(oldTokenString)).thenReturn(Optional.of(existingToken));
            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));
            when(refreshTokenRepo.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

            RefreshToken rotatedToken = refreshTokenService.verifyAndRotate(oldTokenString);

            assertThat(rotatedToken).isNotNull();
            assertThat(rotatedToken.getToken()).isNotEqualTo(oldTokenString);
            assertThat(rotatedToken.getUser()).isEqualTo(sampleUser);

            verify(refreshTokenRepo).delete(existingToken);
            verify(refreshTokenRepo).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("Should throw BadCredentialsException when refresh token is not found")
        void verifyAndRotate_TokenNotFound_ThrowsException() {
            when(refreshTokenRepo.findByToken("non_existent_token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refreshTokenService.verifyAndRotate("non_existent_token"))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Refresh token not found or invalid.");

            verify(refreshTokenRepo, never()).delete(any(RefreshToken.class));
            verify(refreshTokenRepo, never()).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("Should delete expired refresh token and throw BadCredentialsException")
        void verifyAndRotate_ExpiredToken_DeletesAndThrowsException() {
            String expiredTokenString = "expired_token";
            RefreshToken expiredToken = RefreshToken.builder()
                    .token(expiredTokenString)
                    .user(sampleUser)
                    .expiryDate(Instant.now().minusSeconds(100))
                    .build();

            when(refreshTokenRepo.findByToken(expiredTokenString)).thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> refreshTokenService.verifyAndRotate(expiredTokenString))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Refresh token has expired. Please login again.");

            verify(refreshTokenRepo).delete(expiredToken);
            verify(refreshTokenRepo, never()).save(any(RefreshToken.class));
        }
    }
}
