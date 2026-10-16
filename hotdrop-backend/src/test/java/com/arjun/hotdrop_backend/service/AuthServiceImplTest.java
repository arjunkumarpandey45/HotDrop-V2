package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.OtpVerification;
import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.mapper.AuthMapper;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.OtpVerificationRepo;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.RoleRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepo userRepo;
    @Mock
    private RoleRepo roleRepo;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private TokenBlacklistService tokenBlacklistService;
    @Mock
    private EmailService emailService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private OtpVerificationRepo otpVerificationRepo;
    @Mock
    private RefreshTokenRepo refreshTokenRepo;
    @Mock
    private UserMapper userMapper;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthMapper authMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private Role defaultRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendURL", "https://hotdrop.vercel.app");

        defaultRole = Role.builder()
                .id(UUID.randomUUID())
                .roleName(RoleType.USER)
                .build();

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@hotdrop.io")
                .hotdropId("test_dev")
                .firstName("Arjun")
                .lastName("Pandey")
                .password("encoded_password")
                .emailVerified(true)
                .banned(false)
                .roles(Set.of(defaultRole))
                .build();
    }
    // 1. REGISTRATION TESTS (5 Scenarios)
    @Nested
    @DisplayName("Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should successfully register a brand new user and send verification link")
        void register_NewUser_Success() {
            RegisterRequestDto request = new RegisterRequestDto();
            request.setEmail("test@hotdrop.io");
            request.setHotdropId("test_dev");
            request.setFirstName("Arjun");
            request.setLastName("Pandey");
            request.setPassword("Password@123");

            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.empty());
            when(userRepo.existsByHotdropId("test_dev")).thenReturn(false);
            when(roleRepo.findByRoleName(RoleType.USER)).thenReturn(Optional.of(defaultRole));
            when(passwordEncoder.encode("Password@123")).thenReturn("encoded_password");
            when(userRepo.save(any(User.class))).thenReturn(sampleUser);
            when(jwtService.generateEmailVerificationToken("test@hotdrop.io")).thenReturn("mock_token");

            UserResponseDto mockResponseDto = new UserResponseDto();
            mockResponseDto.setHotdropId("test_dev");
            when(userMapper.toResponseDto(sampleUser, 0, 0, 0)).thenReturn(mockResponseDto);

            UserResponseDto response = authService.register(request);

            assertThat(response).isNotNull();
            assertThat(response.getHotdropId()).isEqualTo("test_dev");
            verify(userRepo).save(any(User.class));
            verify(emailService).sendVerificationEmail(
                    eq("test@hotdrop.io"),
                    eq("Arjun"),
                    eq("https://hotdrop.vercel.app/auth/verify-email?token=mock_token")
            );
        }

        @Test
        @DisplayName("Should update unverified existing user credentials upon re-registration")
        void register_ExistingUnverifiedUser_UpdatesCredentials() {
            User existingUnverified = User.builder()
                    .id(UUID.randomUUID())
                    .email("test@hotdrop.io")
                    .hotdropId("old_dev")
                    .firstName("Old")
                    .lastName("Name")
                    .emailVerified(false)
                    .build();

            RegisterRequestDto request = new RegisterRequestDto();
            request.setEmail("test@hotdrop.io");
            request.setHotdropId("test_dev");
            request.setFirstName("Arjun");
            request.setLastName("Pandey");
            request.setPassword("NewPassword@123");

            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(existingUnverified));
            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.empty());
            when(passwordEncoder.encode("NewPassword@123")).thenReturn("new_encoded_password");
            when(userRepo.save(existingUnverified)).thenReturn(existingUnverified);
            when(jwtService.generateEmailVerificationToken("test@hotdrop.io")).thenReturn("mock_token");

            authService.register(request);

            assertThat(existingUnverified.getHotdropId()).isEqualTo("test_dev");
            assertThat(existingUnverified.getFirstName()).isEqualTo("Arjun");
            assertThat(existingUnverified.getPassword()).isEqualTo("new_encoded_password");
            assertThat(existingUnverified.isEmailVerified()).isFalse();
            verify(userRepo).save(existingUnverified);
            verify(emailService).sendVerificationEmail(eq("test@hotdrop.io"), eq("Arjun"), anyString());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when unverified user tries to claim an already taken hotdropId")
        void register_ExistingUnverifiedUser_HotdropIdTakenByOther_ThrowsException() {
            User existingUnverified = User.builder()
                    .id(UUID.randomUUID())
                    .email("test@hotdrop.io")
                    .emailVerified(false)
                    .build();

            User otherUser = User.builder()
                    .id(UUID.randomUUID())
                    .hotdropId("test_dev")
                    .build();

            RegisterRequestDto request = new RegisterRequestDto();
            request.setEmail("test@hotdrop.io");
            request.setHotdropId("test_dev");

            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(existingUnverified));
            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(otherUser));

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Hotdrop ID is already taken.");

            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when default role USER is missing from database")
        void register_DefaultRoleMissing_ThrowsException() {
            RegisterRequestDto request = new RegisterRequestDto();
            request.setEmail("fresh@hotdrop.io");
            request.setHotdropId("fresh_dev");

            when(userRepo.findByEmail("fresh@hotdrop.io")).thenReturn(Optional.empty());
            when(userRepo.existsByHotdropId("fresh_dev")).thenReturn(false);
            when(roleRepo.findByRoleName(RoleType.USER)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Default role 'USER' not found in database.");

            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when email is already registered and verified")
        void register_AlreadyVerifiedEmail_ThrowsException() {
            RegisterRequestDto request = new RegisterRequestDto();
            request.setEmail("test@hotdrop.io");
            request.setHotdropId("test_dev");

            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Email already exists and is verified.");

            verify(userRepo, never()).save(any(User.class));
            verifyNoInteractions(emailService);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when new user attempts to register with already taken hotdropId")
        void register_NewEmailWithTakenHotdropId_ThrowsException() {
            RegisterRequestDto request = new RegisterRequestDto();
            request.setEmail("brandnew@hotdrop.io");
            request.setHotdropId("taken_dev");

            when(userRepo.findByEmail("brandnew@hotdrop.io")).thenReturn(Optional.empty());
            when(userRepo.existsByHotdropId("taken_dev")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Hotdrop ID is already taken.");

            verify(userRepo, never()).save(any(User.class));
            verifyNoInteractions(emailService);
        }
    }

     // 2. RE-VERIFY EMAIL TESTS (4 Scenarios)
     @Nested
    @DisplayName("Re-Verify Email Tests")
    class ReVerifyEmailTests {

        @Test
        @DisplayName("Should send new verification link when user exists and is unverified")
        void reVerifyEmail_Success() {
            sampleUser.setEmailVerified(false);
            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));
            when(jwtService.generateEmailVerificationToken("test@hotdrop.io")).thenReturn("mock_reverify_token");

            authService.reVerifyEmail("  test@hotdrop.io  ");

            verify(emailService).sendVerificationEmail(
                    eq("test@hotdrop.io"),
                    eq("Arjun"),
                    eq("https://hotdrop.vercel.app/auth/verify-email?token=mock_reverify_token")
            );
        }

        @Test
        @DisplayName("Should return silently when input email is null or blank")
        void reVerifyEmail_NullOrBlank_SkipsExecution() {
            authService.reVerifyEmail(null);
            authService.reVerifyEmail("   ");

            verifyNoInteractions(userRepo);
            verifyNoInteractions(emailService);
        }

        @Test
        @DisplayName("Should return silently when email does not exist in database")
        void reVerifyEmail_UserNotFound_SkipsExecution() {
            when(userRepo.findByEmail("unknown@hotdrop.io")).thenReturn(Optional.empty());

            authService.reVerifyEmail("unknown@hotdrop.io");

            verify(emailService, never()).sendVerificationEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("Should skip sending email when user is already email verified")
        void reVerifyEmail_AlreadyVerified_SkipsExecution() {
            sampleUser.setEmailVerified(true);
            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));

            authService.reVerifyEmail("test@hotdrop.io");

            verify(jwtService, never()).generateEmailVerificationToken(anyString());
            verify(emailService, never()).sendVerificationEmail(anyString(), anyString(), anyString());
        }
    }

    // 3. EMAIL VERIFICATION TESTS (5 Scenarios)
   @Nested
    @DisplayName("Email Verification Tests")
    class EmailVerificationTests {

        @Test
        @DisplayName("Should successfully verify unverified user and blacklist used token")
        void verifyEmail_Success() {
            sampleUser.setEmailVerified(false);
            when(jwtService.validateEmailToken("valid_token")).thenReturn(true);
            when(tokenBlacklistService.isTokenBlacklisted("valid_token")).thenReturn(false);
            when(jwtService.getEmailFromToken("valid_token")).thenReturn("test@hotdrop.io");
            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));
            when(jwtService.getRemainingExpirationTime("valid_token")).thenReturn(300000L);

            String result = authService.verifyEmail("valid_token");

            assertThat(result).isEqualTo("Email verified successfully!");
            assertThat(sampleUser.isEmailVerified()).isTrue();
            verify(userRepo).save(sampleUser);
            verify(tokenBlacklistService).blacklistToken("valid_token", 300000L);
        }

        @Test
        @DisplayName("Should return early message without saving or blacklisting if user is already verified")
        void verifyEmail_AlreadyVerifiedUser_ReturnsMessageEarly() {
            sampleUser.setEmailVerified(true);
            when(jwtService.validateEmailToken("valid_token")).thenReturn(true);
            when(tokenBlacklistService.isTokenBlacklisted("valid_token")).thenReturn(false);
            when(jwtService.getEmailFromToken("valid_token")).thenReturn("test@hotdrop.io");
            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));

            String result = authService.verifyEmail("valid_token");

            assertThat(result).isEqualTo("Email is already verified.");
            verify(userRepo, never()).save(any(User.class));
            verify(tokenBlacklistService, never()).blacklistToken(anyString(), anyLong());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when email in token belongs to no user")
        void verifyEmail_UserNotFound_ThrowsException() {
            when(jwtService.validateEmailToken("orphan_token")).thenReturn(true);
            when(tokenBlacklistService.isTokenBlacklisted("orphan_token")).thenReturn(false);
            when(jwtService.getEmailFromToken("orphan_token")).thenReturn("ghost@hotdrop.io");
            when(userRepo.findByEmail("ghost@hotdrop.io")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.verifyEmail("orphan_token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found.");

            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException if token is already blacklisted")
        void verifyEmail_TokenBlacklisted_ThrowsException() {
            when(jwtService.validateEmailToken("reused_token")).thenReturn(true);
            when(tokenBlacklistService.isTokenBlacklisted("reused_token")).thenReturn(true);

            assertThatThrownBy(() -> authService.verifyEmail("reused_token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("This verification link has already been used.");

            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException if token is expired or structurally invalid")
        void verifyEmail_InvalidToken_ThrowsException() {
            when(jwtService.validateEmailToken("bad_token")).thenReturn(false);

            assertThatThrownBy(() -> authService.verifyEmail("bad_token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid or expired verification token.");
        }
    }

    // 4. LOGIN TESTS (5 Scenarios)
     @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully, update lastLoginAt, and return AuthResultDto")
        void login_Success() {
            LoginRequestDto request = new LoginRequestDto();
            request.setHotdropIdOrEmail("test_dev");
            request.setPassword("Password@123");

            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));

            Authentication auth = mock(Authentication.class);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
            when(jwtService.generateToken(auth)).thenReturn("sample_access_jwt");

            RefreshToken mockRefreshToken = RefreshToken.builder().token("sample_refresh_token").build();
            when(refreshTokenService.createRefreshToken("test_dev")).thenReturn(mockRefreshToken);

            LoginResponseDto loginDto = new LoginResponseDto();
            when(authMapper.toLoginResponseDto(eq("test_dev"), eq("test@hotdrop.io"), any())).thenReturn(loginDto);

            AuthResultDto expectedResult = AuthResultDto.builder()
                    .accessToken("sample_access_jwt")
                    .refreshToken("sample_refresh_token")
                    .loginResponse(loginDto)
                    .build();
            when(authMapper.toAuthResultDto("sample_access_jwt", "sample_refresh_token", loginDto)).thenReturn(expectedResult);

            AuthResultDto result = authService.login(request);

            assertThat(result).isNotNull();
            assertThat(sampleUser.getLastLoginAt()).isNotNull();
            verify(userRepo).save(sampleUser);
        }

        @Test
        @DisplayName("Should login successfully using email as identifier")
        void login_WithEmail_Success() {
            LoginRequestDto request = new LoginRequestDto();
            request.setHotdropIdOrEmail("test@hotdrop.io");
            request.setPassword("Password@123");

            when(userRepo.findByHotdropId("test@hotdrop.io")).thenReturn(Optional.empty());
            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));

            Authentication auth = mock(Authentication.class);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
            when(jwtService.generateToken(auth)).thenReturn("sample_access_jwt");

            RefreshToken mockRefreshToken = RefreshToken.builder().token("sample_refresh_token").build();
            when(refreshTokenService.createRefreshToken("test_dev")).thenReturn(mockRefreshToken);

            LoginResponseDto loginDto = new LoginResponseDto();
            when(authMapper.toLoginResponseDto(eq("test_dev"), eq("test@hotdrop.io"), any())).thenReturn(loginDto);

            AuthResultDto expectedResult = AuthResultDto.builder()
                    .accessToken("sample_access_jwt")
                    .refreshToken("sample_refresh_token")
                    .loginResponse(loginDto)
                    .build();
            when(authMapper.toAuthResultDto("sample_access_jwt", "sample_refresh_token", loginDto)).thenReturn(expectedResult);

            AuthResultDto result = authService.login(request);

            assertThat(result).isNotNull();
            assertThat(sampleUser.getLastLoginAt()).isNotNull();
            verify(userRepo).save(sampleUser);
        }

        @Test
        @DisplayName("Should throw BadCredentialsException when authenticationManager rejects password")
        void login_WrongPassword_ThrowsBadCredentialsException() {
            LoginRequestDto request = new LoginRequestDto();
            request.setHotdropIdOrEmail("test_dev");
            request.setPassword("WrongPassword");

            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);

            verify(jwtService, never()).generateToken(any());
            verify(refreshTokenService, never()).createRefreshToken(anyString());
        }

        @Test
        @DisplayName("Should block login if user account is not email verified")
        void login_UnverifiedUser_ThrowsException() {
            sampleUser.setEmailVerified(false);
            LoginRequestDto request = new LoginRequestDto();
            request.setHotdropIdOrEmail("test_dev");
            request.setPassword("Password@123");

            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Please verify your email before logging in.");

            verifyNoInteractions(authenticationManager);
        }

        @Test
        @DisplayName("Should block login if user account is banned")
        void login_BannedUser_ThrowsException() {
            sampleUser.setBanned(true);
            LoginRequestDto request = new LoginRequestDto();
            request.setHotdropIdOrEmail("test_dev");
            request.setPassword("Password@123");

            when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Your account has been banned.");

            verifyNoInteractions(authenticationManager);
        }

        @Test
        @DisplayName("Should throw BadCredentialsException when account does not exist")
        void login_AccountNotFound_ThrowsBadCredentialsException() {
            LoginRequestDto request = new LoginRequestDto();
            request.setHotdropIdOrEmail("nonexistent_user");
            request.setPassword("Password@123");

            when(userRepo.findByHotdropId("nonexistent_user")).thenReturn(Optional.empty());
            when(userRepo.findByEmail("nonexistent_user")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Invalid Hotdrop ID/Email or password.");
        }
    }
    // 5. FORGOT PASSWORD TESTS (3 Scenarios)
    @Nested
    @DisplayName("Forgot Password Tests")
    class ForgotPasswordTests {

        @Test
        @DisplayName("Should generate 6-digit OTP, persist entity, and send email")
        void sendForgotPasswordOtp_Success() {
            ForgotPasswordRequestDto request = new ForgotPasswordRequestDto();
            request.setEmail("test@hotdrop.io");

            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.encode(anyString())).thenReturn("hashed_otp");

            authService.sendForgotPasswordOtp(request);

            verify(otpVerificationRepo).deleteByEmail("test@hotdrop.io");
            verify(otpVerificationRepo).flush();

            ArgumentCaptor<OtpVerification> captor = ArgumentCaptor.forClass(OtpVerification.class);
            verify(otpVerificationRepo).save(captor.capture());
            OtpVerification savedOtp = captor.getValue();

            assertThat(savedOtp.getEmail()).isEqualTo("test@hotdrop.io");
            assertThat(savedOtp.getOtpHash()).isEqualTo("hashed_otp");
            assertThat(savedOtp.getExpiryDate()).isAfter(LocalDateTime.now());
            verify(emailService).sendOTP(eq("test@hotdrop.io"), eq("Arjun"), anyString());
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when email does not exist")
        void sendForgotPasswordOtp_EmailNotFound_ThrowsException() {
            ForgotPasswordRequestDto request = new ForgotPasswordRequestDto();
            request.setEmail("unknown@hotdrop.io");

            when(userRepo.findByEmail("unknown@hotdrop.io")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.sendForgotPasswordOtp(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No account registered with this email address.");

            verifyNoInteractions(otpVerificationRepo);
            verifyNoInteractions(emailService);
        }

        @Test
        @DisplayName("Should throw AccessDeniedException if banned user attempts password reset")
        void sendForgotPasswordOtp_BannedUser_ThrowsException() {
            sampleUser.setBanned(true);
            ForgotPasswordRequestDto request = new ForgotPasswordRequestDto();
            request.setEmail("test@hotdrop.io");

            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.sendForgotPasswordOtp(request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Account is restricted.");

            verifyNoInteractions(otpVerificationRepo);
        }
    }
    // 6. RESET PASSWORD TESTS (5 Scenarios)
     @Nested
    @DisplayName("Reset Password Tests")
    class ResetPasswordTests {

        @Test
        @DisplayName("Should successfully reset password when OTP is valid and matches")
        void resetPasswordWithOtp_Success() {
            ResetPasswordDto request = new ResetPasswordDto();
            request.setEmail("test@hotdrop.io");
            request.setOtp("123456");
            request.setNewPassword("BrandNewPassword@123");

            OtpVerification activeOtp = OtpVerification.builder()
                    .email("test@hotdrop.io")
                    .otpHash("hashed_otp")
                    .expiryDate(LocalDateTime.now().plusMinutes(3))
                    .build();

            when(otpVerificationRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(activeOtp));
            when(passwordEncoder.matches("123456", "hashed_otp")).thenReturn(true);
            when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.encode("BrandNewPassword@123")).thenReturn("new_encoded_password");

            authService.resetPasswordWithOtp(request);

            assertThat(sampleUser.getPassword()).isEqualTo("new_encoded_password");
            verify(userRepo).save(sampleUser);
            verify(otpVerificationRepo).delete(activeOtp);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when OTP record does not exist")
        void resetPasswordWithOtp_OtpNotFound_ThrowsException() {
            ResetPasswordDto request = new ResetPasswordDto();
            request.setEmail("test@hotdrop.io");

            when(otpVerificationRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resetPasswordWithOtp(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("OTP session not found or invalid request.");

            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when OTP has expired and delete expired session")
        void resetPasswordWithOtp_ExpiredOtp_ThrowsException() {
            ResetPasswordDto request = new ResetPasswordDto();
            request.setEmail("test@hotdrop.io");
            request.setOtp("123456");

            OtpVerification expiredOtp = OtpVerification.builder()
                    .email("test@hotdrop.io")
                    .otpHash("hashed_otp")
                    .expiryDate(LocalDateTime.now().minusMinutes(1))
                    .build();

            when(otpVerificationRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(expiredOtp));

            assertThatThrownBy(() -> authService.resetPasswordWithOtp(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("OTP has expired.");

            verify(otpVerificationRepo).delete(expiredOtp);
            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when OTP is incorrect")
        void resetPasswordWithOtp_WrongOtp_ThrowsException() {
            ResetPasswordDto request = new ResetPasswordDto();
            request.setEmail("test@hotdrop.io");
            request.setOtp("999999");

            OtpVerification activeOtp = OtpVerification.builder()
                    .email("test@hotdrop.io")
                    .otpHash("hashed_otp")
                    .expiryDate(LocalDateTime.now().plusMinutes(3))
                    .build();

            when(otpVerificationRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(activeOtp));
            when(passwordEncoder.matches("999999", "hashed_otp")).thenReturn(false);

            assertThatThrownBy(() -> authService.resetPasswordWithOtp(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid OTP entered.");

            verify(userRepo, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user record is missing despite valid OTP")
        void resetPasswordWithOtp_UserNotFound_ThrowsException() {
            ResetPasswordDto request = new ResetPasswordDto();
            request.setEmail("ghost@hotdrop.io");
            request.setOtp("123456");

            OtpVerification activeOtp = OtpVerification.builder()
                    .email("ghost@hotdrop.io")
                    .otpHash("hashed_otp")
                    .expiryDate(LocalDateTime.now().plusMinutes(3))
                    .build();

            when(otpVerificationRepo.findByEmail("ghost@hotdrop.io")).thenReturn(Optional.of(activeOtp));
            when(passwordEncoder.matches("123456", "hashed_otp")).thenReturn(true);
            when(userRepo.findByEmail("ghost@hotdrop.io")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resetPasswordWithOtp(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found.");
        }
    }
    // 7. LOGOUT TESTS (4 Scenarios)
     @Nested
    @DisplayName("Logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should strip Bearer prefix, blacklist access token, and delete refresh token")
        void logout_Success() {
            String rawAccessToken = "Bearer mock_access_token";
            String rawRefreshToken = "mock_refresh_token";

            when(jwtService.getRemainingExpirationTime("mock_access_token")).thenReturn(60000L);

            RefreshToken tokenEntity = RefreshToken.builder()
                    .token(rawRefreshToken)
                    .user(sampleUser)
                    .build();
            when(refreshTokenRepo.findByToken(rawRefreshToken)).thenReturn(Optional.of(tokenEntity));

            authService.logout(rawAccessToken, rawRefreshToken);

            verify(tokenBlacklistService).blacklistToken("mock_access_token", 60000L);
            verify(refreshTokenRepo).delete(tokenEntity);
        }

        @Test
        @DisplayName("Should not blacklist access token if remaining expiration TTL is zero or negative")
        void logout_ExpiredAccessToken_DoesNotBlacklist() {
            String rawAccessToken = "Bearer expired_access_token";

            when(jwtService.getRemainingExpirationTime("expired_access_token")).thenReturn(0L);

            authService.logout(rawAccessToken, null);

            verify(tokenBlacklistService, never()).blacklistToken(anyString(), anyLong());
        }

        @Test
        @DisplayName("Should complete logout smoothly even if refresh token does not exist in database")
        void logout_RefreshTokenNotFound_CompletesSilently() {
            String rawRefreshToken = "non_existent_refresh_token";
            when(refreshTokenRepo.findByToken(rawRefreshToken)).thenReturn(Optional.empty());

            authService.logout(null, rawRefreshToken);

            verify(refreshTokenRepo, never()).delete(any(RefreshToken.class));
        }

        @Test
        @DisplayName("Should handle logout gracefully when tokens are null or blank")
        void logout_NullTokens_HandledSafely() {
            authService.logout(null, "");

            verifyNoInteractions(tokenBlacklistService);
            verifyNoInteractions(refreshTokenRepo);
        }
    }
}