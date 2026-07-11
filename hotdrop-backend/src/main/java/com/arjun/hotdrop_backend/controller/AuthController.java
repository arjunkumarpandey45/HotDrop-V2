package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.LoginRequestDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.RegisterRequestDto;
import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.repository.RefreshTokenRepo;
import com.arjun.hotdrop_backend.service.AuthService;
import com.arjun.hotdrop_backend.service.RefreshTokenService;
import com.arjun.hotdrop_backend.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepo refreshTokenRepo;
    private final JwtUtils jwtUtils;

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> signup(@Valid @RequestBody RegisterRequestDto registerRequestDto) {
        return ResponseEntity.ok(authService.register(registerRequestDto));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok("Email verified successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
        String jwtToken = authService.login(loginRequestDto);
        LoginResponseDto responseDto = authService.getLoginResponseDetails(loginRequestDto.getUsernameOrEmail());
        var refreshToken = refreshTokenService.createRefreshToken(responseDto.getUsername());


        ResponseCookie accessCookie = ResponseCookie.from("accessToken", jwtToken)
                .httpOnly(true).secure(false).path("/").maxAge(15 * 60).sameSite("Strict").build();


        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                .httpOnly(true).secure(false).path("/").maxAge(30 * 24 * 60 * 60).sameSite("Strict").build();


        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(responseDto);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
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
            return ResponseEntity.badRequest().body("Refresh Token is missing!");
        }


        return refreshTokenRepo.findByToken(refreshTokenFromCookie)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                   
                    String newAccessToken = jwtUtils.generateTokenFromUsername(user.getUsername());

                    ResponseCookie newAccessCookie = ResponseCookie.from("accessToken", newAccessToken)
                            .httpOnly(true).secure(false).path("/").maxAge(15 * 60).sameSite("Strict").build();

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                            .body("Token refreshed successfully!");
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }
}
