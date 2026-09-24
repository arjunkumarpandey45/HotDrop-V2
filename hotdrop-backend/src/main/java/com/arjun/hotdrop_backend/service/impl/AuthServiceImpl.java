package com.arjun.hotdrop_backend.service.impl;


import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.OtpVerification;
import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.OtpVerificationRepo;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.RoleRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.*;
import com.arjun.hotdrop_backend.utils.MaskUtils;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${FRONTEND_URL}")
    private String frontendURL;
    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final OtpVerificationRepo otpVerificationRepo;
    private final RefreshTokenRepo refreshTokenRepo;
    private final UserMapper userMapper;
    private final JwtService jwtService;


    @Transactional
    @Override
    public UserResponseDto register(RegisterRequestDto registerRequestDto) {
        String email = registerRequestDto.getEmail().trim().toLowerCase();
        String hotdropId = registerRequestDto.getHotdropId().trim().toLowerCase();

        log.info("Processing registration for hotdropId: {} (email: {})", hotdropId, MaskUtils.maskEmail(email));

        Optional<User> existingUserOpt = userRepo.findByEmail(email);

        User userToSave;

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            if (existingUser.isEmailVerified()) {
                log.warn("Registration rejected: Email {} is already verified", MaskUtils.maskEmail(email));
                throw new IllegalArgumentException("Email already exists and is verified.");
            }


            Optional<User> hotdropIdOwner = userRepo.findByHotdropId(hotdropId);
            if (hotdropIdOwner.isPresent() && !hotdropIdOwner.get().getId().equals(existingUser.getId())) {
                log.warn("Registration rejected: HotdropId {} already claimed by another account", hotdropId);
                throw new IllegalArgumentException("Hotdrop ID is already taken.");
            }

            existingUser.setHotdropId(hotdropId);
            existingUser.setFirstName(registerRequestDto.getFirstName().trim());
            existingUser.setLastName(registerRequestDto.getLastName().trim());
            existingUser.setPassword(passwordEncoder.encode(registerRequestDto.getPassword()));
            existingUser.setEmailVerified(false);

            userToSave = userRepo.save(existingUser);
            log.info("Updated unverified account credentials for user: {}", hotdropId);
        } else {

            if (userRepo.existsByHotdropId(hotdropId)) {
                log.warn("Registration rejected: HotdropId {} is already taken", hotdropId);
                throw new IllegalArgumentException("Hotdrop ID is already taken.");
            }

            Role defaultRole = roleRepo.findByRoleName(RoleType.USER)
                    .orElseThrow(() -> new ResourceNotFoundException("Default role 'USER' not found in database."));

            User newUser = User.builder()
                    .hotdropId(hotdropId)
                    .email(email)
                    .firstName(registerRequestDto.getFirstName().trim())
                    .lastName(registerRequestDto.getLastName().trim())
                    .password(passwordEncoder.encode(registerRequestDto.getPassword()))
                    .roles(Set.of(defaultRole))
                    .authProvider(AuthProvider.LOCAL)
                    .emailVerified(false)
                    .build();

            userToSave = userRepo.save(newUser);
            log.info("Registered new user with ID: {}", userToSave.getId());
        }
        String verificationToken = jwtService.generateEmailVerificationToken(userToSave.getEmail());
        String verificationLink = frontendURL + "/auth/verify-email?token=" + verificationToken;

        emailService.sendVerificationEmail(
                userToSave.getEmail(),
                userToSave.getFirstName(),
                verificationLink
        );

        return userMapper.toResponseDto(userToSave);
    }
    @Transactional
    @Override
    public void reVerifyEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            log.warn("Re-verification request received with empty email");
            return;
        }
        String email = rawEmail.trim().toLowerCase();
        log.info("Processing re-verification email request for: {}", MaskUtils.maskEmail(email));
        Optional<User> existingUser = userRepo.findByEmail(email);

        if (existingUser.isEmpty()) {
            log.warn("Re-verification requested for unregistered email: {}", MaskUtils.maskEmail(email));
            return;
        }

        User user = existingUser.get();



            if (user.isEmailVerified()) {
                log.info("Re-verification skipped: Email is already verified for user: {}", user.getHotdropId());
                return;

        }

        String token =
                jwtService.generateEmailVerificationToken(user.getEmail());

        String verificationLink =
                frontendURL + "/auth/verify-email?token=" + token;

        emailService.sendVerificationEmail(
                user.getEmail(),
                user.getFirstName(),
                verificationLink
        );

        log.info("Sent verification email for user: {}", user.getHotdropId());

    }
    @Override
    @Transactional
    public String verifyEmail(String token) {
        log.info("Verifying email token.");

        if (!jwtService.validateEmailToken(token)) {
            log.warn("Email verification failed: token is expired or invalid.");
            throw new IllegalArgumentException("Invalid or expired verification token.");
        }

        if (tokenBlacklistService.isTokenBlacklisted(token)) {
            log.warn("Email verification rejected: token already used.");
            throw new IllegalArgumentException("This verification link has already been used.");
        }
        String email = jwtService.getEmailFromToken(token);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Email verification failed: no user found for email: {}", MaskUtils.maskEmail(email));
                    return new IllegalArgumentException("User not found.");
                });

        if (user.isEmailVerified()) {
            log.info("Email verification skipped: User {} is already verified.", user.getHotdropId());
            return "Email is already verified.";
        }

        user.setEmailVerified(true);
        userRepo.save(user);
        long remainingMs = jwtService.getRemainingExpirationTime(token);
        tokenBlacklistService.blacklistToken(token, remainingMs);
        log.info("Email verified successfully for user: {}", user.getHotdropId());
        return "Email verified successfully!";
    }

    @Override

    public AuthResultDto login(LoginRequestDto loginRequestDto) {
        String identifier = loginRequestDto.getHotdropIdOrEmail().trim().toLowerCase();
        log.info("User attempting login: {}", MaskUtils.maskIdentifier(identifier));

        User user = userRepo.findByHotdropId(identifier)
                .or(() -> userRepo.findByEmail(identifier))
                .orElseThrow(() -> {
                    log.warn("Login failed: no account found for identifier: {}", MaskUtils.maskIdentifier(identifier));
                    return new BadCredentialsException("Invalid Hotdrop ID/Email or password.");
                });

        if (!user.isEmailVerified()) {
            log.warn("Email not verified for user: {}", user.getHotdropId());
            throw new IllegalStateException("Please verify your email before logging in.");
        }

        if (user.isBanned()) {
            log.warn("Login blocked: user {} is banned.", user.getHotdropId());
            throw new IllegalStateException("Your account has been banned.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getHotdropId(), loginRequestDto.getPassword()));

        user.setLastLoginAt(LocalDateTime.now());
        userRepo.save(user);
        String accessToken = jwtService.generateToken(authentication);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getHotdropId());
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .toList();

        LoginResponseDto responseDto = LoginResponseDto.builder()
                .hotdropId(user.getHotdropId())
                .email(user.getEmail())
                .roles(roles)
                .build();
        log.info("User {} logged in successfully.", user.getHotdropId());
        return AuthResultDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .userDetails(responseDto)
                .build();
    }


    @Override
    @Transactional

    public void sendForgotPasswordOtp(ForgotPasswordRequestDto request) {
        log.info("Sending password reset code to: {}", MaskUtils.maskEmail(request.getEmail()));

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Cannot reset password: no user found with email: {}", MaskUtils.maskEmail(request.getEmail()));
                    return new RuntimeException("No account registered with this email address.");
                });

        if (user.isBanned()) {
            log.warn("Cannot reset password: user {} is banned.", user.getHotdropId());
            throw new RuntimeException("Account is restricted.");
        }

        java.security.SecureRandom random = new java.security.SecureRandom();
        int otpNum = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpNum);

        String hashedOtp = passwordEncoder.encode(otp);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

        otpVerificationRepo.deleteByEmail(user.getEmail());
        otpVerificationRepo.flush();
        otpVerificationRepo.save(OtpVerification.builder()
                .email(user.getEmail())
                .otpHash(hashedOtp)
                .expiryDate(expiry)
                .build());

        emailService.sendOTP(user.getEmail(), user.getFirstName(), otp);
        log.info("Sent password reset code for user: {}", user.getHotdropId());
    }

    @Override
    @Transactional
    public void resetPasswordWithOtp(ResetPasswordDto request) {
        log.info("Resetting password with code for: {}", MaskUtils.maskEmail(request.getEmail()));

        OtpVerification otpVerification = otpVerificationRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Cannot reset password: reset code not found for: {}", MaskUtils.maskEmail(request.getEmail()));
                    return new RuntimeException("OTP session not found or invalid request.");
                });

        if (otpVerification.getExpiryDate().isBefore(LocalDateTime.now())) {
            otpVerificationRepo.delete(otpVerification);
            log.warn("Cannot reset password: reset code expired for: {}", MaskUtils.maskEmail(request.getEmail()));
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(request.getOtp(), otpVerification.getOtpHash())) {
            log.warn("Cannot reset password: wrong reset code for: {}", MaskUtils.maskEmail(request.getEmail()));
            throw new RuntimeException("Invalid OTP entered.");
        }

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Cannot reset password: user not found for email: {}", MaskUtils.maskEmail(request.getEmail()));
                    return new RuntimeException("User not found.");
                });

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        otpVerificationRepo.delete(otpVerification);
        log.info("Updated password for user: {}", user.getHotdropId());
    }
@Transactional
    public void logout(String accessToken, String refreshToken) {
        log.info("Logging out user.");


        if (accessToken != null && !accessToken.isBlank()) {

            String cleanToken = accessToken.startsWith("Bearer ")
                    ? accessToken.substring(7)
                    : accessToken;

            long remainingTtl = jwtService.getRemainingExpirationTime(cleanToken);

            if (remainingTtl > 0) {
                tokenBlacklistService.blacklistToken(cleanToken, remainingTtl);
                log.info("Blocked token for {} ms.", remainingTtl);
            }
        }


        if (refreshToken != null && !refreshToken.isEmpty()) {
            refreshTokenRepo.findByToken(refreshToken)
                    .ifPresent(token -> {
                        refreshTokenRepo.delete(token);
                        log.info("Removed refresh token for user: {}", token.getUser().getHotdropId());
                    });
        }

        log.info("User logged out successfully.");
    }



}
