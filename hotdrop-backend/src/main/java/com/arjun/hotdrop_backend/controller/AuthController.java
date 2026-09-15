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

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> signup(@Valid @RequestBody RegisterRequestDto registerRequestDto) {
        log.info("Received signup request for user: {} with email: {}", registerRequestDto.getHotdropId(), registerRequestDto.getEmail());
        UserResponseDto responseDto = authService.register(registerRequestDto);
        log.info("User registered successfully: {}", registerRequestDto.getHotdropId());
        return ResponseEntity.ok(responseDto);
    }

    @RateLimited
    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        log.info("Received request to verify email address");
        String message = authService.verifyEmail(token);
        log.info("Email verification result: {}", message);
        return ResponseEntity.ok(message);
    }

    @RateLimited
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
        log.info("Received login request for: {}", loginRequestDto.getHotdropIdOrEmail());
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

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        log.info("Received request to refresh access token");
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
            log.error("Failed to refresh token: refresh token cookie is missing");
            return ResponseEntity.badRequest().body("Refresh Token is missing!");
        }

        return refreshTokenRepo.findByToken(refreshTokenFromCookie)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String newAccessToken = jwtService.generateTokenFromHotdropId(user.getHotdropId());

                    ResponseCookie newAccessCookie = ResponseCookie.from("accessToken", newAccessToken)
                            .httpOnly(true).secure(false).path("/").maxAge(15 * 60).sameSite("Strict").build();

                    log.info("Access token refreshed successfully for user: {}", user.getHotdropId());
                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                            .body("Token refreshed successfully!");
                })
                .orElseThrow(() -> {
                    log.error("Failed to refresh token: token not found in database");
                    return new RuntimeException("Refresh token is not in database!");
                });
    }

    @RateLimited
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto requestDto) {
        log.info("Received forgot-password request for email: {}", requestDto.getEmail());
        authService.sendForgotPasswordOtp(requestDto);
        log.info("Forgot-password OTP sent successfully to email: {}", requestDto.getEmail());
        return ResponseEntity.ok("OTP sent to Your E-Mail ");
    }

    @RateLimited
    @PostMapping("/verify-otp")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        log.info("Received password reset request with OTP for email: {}", resetPasswordDto.getEmail());
        authService.resetPasswordWithOtp(resetPasswordDto);
        log.info("Password reset successfully for email: {}", resetPasswordDto.getEmail());
        return ResponseEntity.ok("Password reset successfully");
    }

    @RateLimited
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        log.info("Received logout request");
        String refreshTokenFromCookie = null;
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshTokenFromCookie = cookie.getValue();
                    break;
                }
            }
        }

        authService.logout(refreshTokenFromCookie);
        ResponseCookie clearAccessCookie = ResponseCookie.from("accessToken", "")
                .maxAge(0)
                .httpOnly(true)
                .secure(false).path("/").sameSite("Strict").build();

        ResponseCookie clearRefreshCookie = ResponseCookie.from("refreshToken", "")
                .maxAge(0)
                .httpOnly(true)
                .secure(false).path("/").sameSite("Strict").build();

        log.info("User logged out successfully and cookies cleared");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .body("Logged out successfully");
    }
}
