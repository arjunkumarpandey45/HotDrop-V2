package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.OtpVerification;
import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.OtpVerificationRepo;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.repository.RoleRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.AuthService;
import com.arjun.hotdrop_backend.service.EmailService;
import com.arjun.hotdrop_backend.service.JwtService;

import com.arjun.hotdrop_backend.service.TokenBlacklistService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
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

    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final OtpVerificationRepo otpVerificationRepo;
    private final RefreshTokenRepo refreshTokenRepo;
    private final UserMapper userMapper;
    private final JwtService jwtService;


    @Override
    public UserResponseDto register(RegisterRequestDto registerRequestDto) {

        log.info("Starting user registration for email: {} and hotdropId: {}",
                registerRequestDto.getEmail(),
                registerRequestDto.getHotdropId());

        String email = registerRequestDto.getEmail();
        String hotdropId = registerRequestDto.getHotdropId();


        Optional<User> existingUser = userRepo.findByEmail(email);

        if (existingUser.isPresent()) {

            User user = existingUser.get();

            if (user.isEmailVerified()) {

                log.warn("Registration rejected: email {} is already verified",
                        email);

                throw new IllegalArgumentException("Email already exists");
            }



            Optional<User> existingHotdropUser =
                    userRepo.findByHotdropId(hotdropId);

            if (existingHotdropUser.isPresent()
                    && !existingHotdropUser.get().getId().equals(user.getId())) {

                log.warn("Registration rejected: hotdropId {} is already in use",
                        hotdropId);

                throw new IllegalArgumentException("Hotdrop Id already exists");
            }


            if (!hotdropId.matches("^[a-zA-Z0-9]+$")) {

                log.warn("Registration rejected: hotdropId {} contains invalid symbols",
                        hotdropId);

                throw new IllegalArgumentException(
                        "Hotdrop ID can only contain letters and numbers"
                );
            }


            user.setHotdropId(hotdropId);

            user.setPassword(
                    passwordEncoder.encode(
                            registerRequestDto.getPassword()
                    )
            );

            user.setFirstName(registerRequestDto.getFirstName());
            user.setLastName(registerRequestDto.getLastName());


            user.setEmailVerified(false);

            userRepo.save(user);

            log.info("Unverified user updated successfully for email: {}",
                    email);

            String token =
                    jwtService.generateEmailVerificationToken(user.getEmail());

            String verificationLink =
                    frontendURL + "/auth/verify-email?token=" + token;


            emailService.sendVerificationEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    verificationLink
            );

            log.info("New verification email sent to: {}", email);

            return userMapper.toResponseDto(user);
        }




        if (!hotdropId.matches("^[a-zA-Z0-9]+$")) {

            log.warn("Registration rejected: hotdropId {} contains invalid symbols",
                    hotdropId);

            throw new IllegalArgumentException(
                    "Hotdrop ID can only contain letters and numbers"
            );
        }


        if (userRepo.existsByHotdropId(hotdropId)) {

            log.warn("Registration rejected: hotdropId {} is already in use",
                    hotdropId);

            throw new IllegalArgumentException("Hotdrop Id already exists");
        }


        Role userRole = roleRepo.findByRoleName(RoleType.USER)
                .orElseThrow(() -> {
                    log.error("Registration failed: default USER role not found");

                    return new RuntimeException("Default role not found");
                });


        User user = userRepo.save(
                User.builder()
                        .hotdropId(hotdropId)
                        .password(
                                passwordEncoder.encode(
                                        registerRequestDto.getPassword()
                                )
                        )
                        .email(email)
                        .authProvider(AuthProvider.LOCAL)
                        .roles(Set.of(userRole))
                        .firstName(registerRequestDto.getFirstName())
                        .lastName(registerRequestDto.getLastName())
                        .emailVerified(false)
                        .build()
        );

        log.info("New user created with ID: {}",
                user.getId());


        String token =
                jwtService.generateEmailVerificationToken(user.getEmail());

        String verificationLink =
                frontendURL + "/auth/verify-email?token=" + token;

        emailService.sendVerificationEmail(
                user.getEmail(),
                user.getFirstName(),
                verificationLink
        );

        log.info("Registration successful for user: {}. Verification email sent to: {}",
                user.getHotdropId(),
                user.getEmail());

        return userMapper.toResponseDto(user);
    }

    @Override
    public void reVerifyEmail(String email) {

        Optional<User> existingUser = userRepo.findByEmail(email);

        if (existingUser.isEmpty()) {
            throw new IllegalArgumentException("Email not registered");
        }

        User user = existingUser.get();

        if (user.isEmailVerified()) {

            log.warn("Re-verification rejected: email {} is already verified",
                    email);

            throw new IllegalArgumentException("Email already verified");
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

        log.info("New verification email sent to: {}", email);

    }
    @Override
    @Transactional
    public String verifyEmail(String token) {
        log.info("Verifying email with verification token");

        if (!jwtService.validateEmailToken(token)) {
            log.error("Email verification failed: token is expired or invalid");
            throw new IllegalArgumentException("Invalid or expired verification token.");
        }

        String email = jwtService.getEmailFromToken(token);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Email verification failed: no user found with email: {}", email);
                    return new IllegalArgumentException("User not found.");
                });

        if (user.isEmailVerified()) {
            log.info("Email {} is already verified", email);
            return "Email is already verified.";
        }

        user.setEmailVerified(true);
        userRepo.save(user);

        log.info("Email {} verified successfully for user: {}", email, user.getHotdropId());
        return "Email verified successfully!";
    }

    @Override
    public String login(LoginRequestDto loginRequestDto) {
        log.info("Attempting login for: {}", loginRequestDto.getHotdropIdOrEmail());

        User user = userRepo.findByHotdropId(loginRequestDto.getHotdropIdOrEmail())
                .or(() -> userRepo.findByEmail(loginRequestDto.getHotdropIdOrEmail()))
                .orElseThrow(() -> {
                    log.error("Login failed: no user found matching {}", loginRequestDto.getHotdropIdOrEmail());
                    return new RuntimeException("Email or Hotdrop Id is not valid");
                });

        if (!user.isEmailVerified()) {
            log.error("Login failed: email is not verified for user: {}", user.getHotdropId());
            throw new RuntimeException("Please verify your email first");
        }

        if (user.isBanned()) {
            log.error("Login failed: account is banned for user: {}", user.getHotdropId());
            throw new RuntimeException("Your account has been banned.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getHotdropId(), loginRequestDto.getPassword()));
        user.setLoggedIn(true);
        user.setLastLoginAt(LocalDateTime.now());
        userRepo.save(user);

        log.info("Login authenticated successfully for user: {}", user.getHotdropId());
        return jwtService.generateToken(authentication);
    }

    @Override
    public LoginResponseDto getLoginResponseDetails(String hotdropIdOrEmail) {
        log.info("Fetching login details for user: {}", hotdropIdOrEmail);

        User user = userRepo.findByHotdropId(hotdropIdOrEmail)
                .or(() -> userRepo.findByEmail(hotdropIdOrEmail))
                .orElseThrow(() -> {
                    log.error("Failed to get login response details: user not found for {}", hotdropIdOrEmail);
                    return new RuntimeException("User not found");
                });

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .toList();

        log.info("Found login profile for user: {} with roles: {}", user.getHotdropId(), roles);

        return LoginResponseDto.builder()
                .hotdropId(user.getHotdropId())
                .email(user.getEmail())
                .roles(roles)
                .isLoggedIn(true)
                .build();
    }

    @Override
    @Transactional
    public void sendForgotPasswordOtp(ForgotPasswordRequestDto request) {
        log.info("Processing forgot-password request for email: {}", request.getEmail());

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("Forgot-password failed: no user found with email: {}", request.getEmail());
                    return new RuntimeException("No account registered with this email address.");
                });

        if (user.isBanned()) {
            log.error("Forgot-password failed: account is restricted for email: {}", request.getEmail());
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
        log.info("Forgot-password OTP sent successfully to: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resetPasswordWithOtp(ResetPasswordDto request) {
        log.info("Processing password reset with OTP for email: {}", request.getEmail());

        OtpVerification otpVerification = otpVerificationRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("Password reset failed: OTP record not found for email: {}", request.getEmail());
                    return new RuntimeException("OTP session not found or invalid request.");
                });

        if (otpVerification.getExpiryDate().isBefore(LocalDateTime.now())) {
            otpVerificationRepo.delete(otpVerification);
            log.error("Password reset failed: OTP expired for email: {}", request.getEmail());
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(request.getOtp(), otpVerification.getOtpHash())) {
            log.error("Password reset failed: invalid OTP code for email: {}", request.getEmail());
            throw new RuntimeException("Invalid OTP entered.");
        }

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("Password reset failed: user not found for email: {}", request.getEmail());
                    return new RuntimeException("User not found.");
                });

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        otpVerificationRepo.delete(otpVerification);
        log.info("Password successfully updated for user: {}", user.getHotdropId());
    }
@Transactional
    public void logout(String accessToken, String refreshToken) {
        log.info("Processing logout request");


        if (accessToken != null && !accessToken.isBlank()) {

            String cleanToken = accessToken.startsWith("Bearer ")
                    ? accessToken.substring(7)
                    : accessToken;

            long remainingTtl = jwtService.getRemainingExpirationTime(cleanToken);

            if (remainingTtl > 0) {
                tokenBlacklistService.blacklistToken(cleanToken, remainingTtl);
                log.info("Access token successfully blacklisted in Redis for {} ms", remainingTtl);
            }
        }


        if (refreshToken != null && !refreshToken.isEmpty()) {
            refreshTokenRepo.findByToken(refreshToken)
                    .ifPresent(token -> {
                        refreshTokenRepo.deleteByUser(token.getUser());
                        log.info("Refresh token invalidated for user: {}", token.getUser().getHotdropId());
                    });
        }

        log.info("Logout process completed");
    }



}
