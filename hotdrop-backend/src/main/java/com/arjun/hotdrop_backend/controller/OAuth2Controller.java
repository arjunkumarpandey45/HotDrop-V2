package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.annotation.RateLimited;
import com.arjun.hotdrop_backend.dto.AuthResultDto;
import com.arjun.hotdrop_backend.dto.LinkedAccountsSummaryDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.OAuthExchangeRequestDto;
import com.arjun.hotdrop_backend.dto.OAuthLinkRequestDto;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class OAuth2Controller {

    private final OAuth2AccountService oAuth2AccountService;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    private boolean isSecure(HttpServletRequest request) {
        return (request != null && request.isSecure()) ||
                (frontendUrl != null && frontendUrl.startsWith("https://"));
    }

    @RateLimited(capacity = 10, refillTokens = 10, refillDurationSeconds = 60)
    @PostMapping("/auth/oauth2/exchange")
    public ResponseEntity<LoginResponseDto> exchangeCode(
            @Valid @RequestBody OAuthExchangeRequestDto requestDto,
            HttpServletRequest request) {
        log.info("Processing OAuth2 exchange code request.");
        AuthResultDto authResult = oAuth2AccountService.exchangeCode(requestDto.getCode());
        return buildAuthResponse(authResult, isSecure(request));
    }

    @RateLimited(capacity = 5, refillTokens = 5, refillDurationSeconds = 60)
    @PostMapping("/auth/oauth2/link")
    public ResponseEntity<LoginResponseDto> linkAccountWithPassword(
            @Valid @RequestBody OAuthLinkRequestDto requestDto,
            HttpServletRequest request) {
        log.info("Processing OAuth2 account link request with password.");
        AuthResultDto authResult = oAuth2AccountService.linkAccountWithPassword(requestDto.getToken(), requestDto.getPassword());
        return buildAuthResponse(authResult, isSecure(request));
    }

    @GetMapping("/users/oauth2/accounts")
    public ResponseEntity<LinkedAccountsSummaryDto> getLinkedAccounts(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        LinkedAccountsSummaryDto summary = oAuth2AccountService.getLinkedAccountsSummary(userDetails.getUsername());
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/users/oauth2/unlink/{provider}")
    public ResponseEntity<Map<String, String>> unlinkProvider(
            @PathVariable String provider,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AuthProvider authProvider;
        try {
            authProvider = AuthProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid authentication provider: " + provider));
        }

        oAuth2AccountService.unlinkAccount(userDetails.getUsername(), authProvider);
        return ResponseEntity.ok(Map.of("message", "Successfully disconnected " + authProvider.name()));
    }

    private ResponseEntity<LoginResponseDto> buildAuthResponse(AuthResultDto authResult, boolean secure) {
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", authResult.getAccessToken())
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(15 * 60)
                .sameSite("Lax")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", authResult.getRefreshToken())
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(30 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        log.info("User {} authenticated successfully via OAuth.", authResult.getLoginResponse().getHotdropId());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(authResult.getLoginResponse());
    }
}
