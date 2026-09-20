package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.annotation.RateLimited;
import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.service.AuthService;
import com.arjun.hotdrop_backend.service.JwtService;
import com.arjun.hotdrop_backend.service.RefreshTokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepo refreshTokenRepo;
    private final JwtService jwtService;
    @RateLimited(capacity = 5, refillTokens = 5, refillDurationSeconds = 300)
    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> signup(@Valid @RequestBody RegisterRequestDto registerRequestDto) {
        log.info("Signing up user {} with email: {}", registerRequestDto.getHotdropId(), registerRequestDto.getEmail());
        UserResponseDto responseDto = authService.register(registerRequestDto);
        log.info("Registered user: {}", registerRequestDto.getHotdropId());
        return ResponseEntity.ok(responseDto);
    }
@PostMapping("/resend-email")
@RateLimited(capacity = 2, refillTokens = 2, refillDurationSeconds = 300)
public ResponseEntity<String> resendVerifyEmail(@RequestBody ReVerificationEmailDto reVerificationEmailDto){
    log.info("Resending verification email to: {}", reVerificationEmailDto.getEmail());
        authService.reVerifyEmail(reVerificationEmailDto.getEmail());
    log.info("Sent verification link to: {}", reVerificationEmailDto.getEmail());
        return ResponseEntity.ok("Verification Link Sent To Your Email");
}
    @RateLimited(capacity = 3, refillTokens = 3, refillDurationSeconds = 60)
    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        log.info("Verifying email address.");
        String message = authService.verifyEmail(token);
        log.info("Email verification result: {}", message);
        return ResponseEntity.ok(message);
    }

    @RateLimited(capacity = 10, refillTokens = 10, refillDurationSeconds = 60)
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
        log.info("Logging in user: {}", loginRequestDto.getHotdropIdOrEmail());
        String jwtToken = authService.login(loginRequestDto);
        LoginResponseDto responseDto = authService.getLoginResponseDetails(loginRequestDto.getHotdropIdOrEmail());
        var refreshToken = refreshTokenService.createRefreshToken(responseDto.getHotdropId());

        ResponseCookie accessCookie = ResponseCookie.from("accessToken", jwtToken)
                .httpOnly(true).secure(false).path("/").maxAge(15 * 60).sameSite("Strict").build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                .httpOnly(true).secure(false).path("/").maxAge(30 * 24 * 60 * 60).sameSite("Strict").build();

        log.info("User logged in successfully: {}", responseDto.getHotdropId());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(responseDto);
    }
    @RateLimited(capacity = 20, refillTokens = 20, refillDurationSeconds = 60)
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        log.info("Refreshing access token.");
        String refreshTokenFromCookie = null;

        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshTokenFromCookie = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshTokenFromCookie == null || refreshTokenFromCookie.isEmpty()) {
            log.error("Cannot refresh token because the cookie is missing.");
            return ResponseEntity.badRequest().body("Refresh Token is missing!");
        }

        return refreshTokenRepo.findByToken(refreshTokenFromCookie)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String newAccessToken = jwtService.generateTokenFromHotdropId(user.getHotdropId());

                    ResponseCookie newAccessCookie = ResponseCookie.from("accessToken", newAccessToken)
                            .httpOnly(true).secure(false).path("/").maxAge(15 * 60).sameSite("Strict").build();

                    log.info("Refreshed access token for user: {}", user.getHotdropId());
                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                            .body("Token refreshed successfully!");
                })
                .orElseThrow(() -> {
                    log.error("Cannot refresh token because it was not found.");
                    return new RuntimeException("Refresh token is not in database!");
                });
    }

    @RateLimited(capacity = 3, refillTokens = 3, refillDurationSeconds = 300)
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto requestDto) {
        log.info("Sending password reset code to: {}", requestDto.getEmail());
        authService.sendForgotPasswordOtp(requestDto);
        log.info("Sent password reset code to: {}", requestDto.getEmail());
        return ResponseEntity.ok("OTP sent to Your E-Mail ");
    }

    @RateLimited(capacity = 4, refillTokens = 4, refillDurationSeconds = 60)
    @PostMapping("/verify-otp")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        log.info("Resetting password for: {}", resetPasswordDto.getEmail());
        authService.resetPasswordWithOtp(resetPasswordDto);
        log.info("Password reset successfully for: {}", resetPasswordDto.getEmail());
        return ResponseEntity.ok("Password reset successfully");
    }

    @RateLimited(capacity = 3, refillTokens = 3, refillDurationSeconds = 60)
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        log.info("Logging out user.");

        String refreshTokenFromCookie = null;
        String accessTokenFromCookie = null;

        // Read both cookies
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshTokenFromCookie = cookie.getValue();
                } else if ("accessToken".equals(cookie.getName())) {
                    accessTokenFromCookie = cookie.getValue();
                }
            }
        }


        authService.logout(accessTokenFromCookie, refreshTokenFromCookie);

        ResponseCookie clearAccessCookie = ResponseCookie.from("accessToken", "")
                .maxAge(0)
                .httpOnly(true)
                .secure(false) // Set to true in production
                .path("/")
                .sameSite("Strict")
                .build();

        ResponseCookie clearRefreshCookie = ResponseCookie.from("refreshToken", "")
                .maxAge(0)
                .httpOnly(true)
                .secure(false) // Set to true in production
                .path("/")
                .sameSite("Strict")
                .build();

        log.info("User logged out successfully.");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .body("Logged out successfully");
    }
}
