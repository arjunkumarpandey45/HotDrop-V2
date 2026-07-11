package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.LoginRequestDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.RegisterRequestDto;
import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.service.AuthService;
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
    public  ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequestDto){
        String jwtToken = authService.login(loginRequestDto);
        LoginResponseDto responseDto = authService.getLoginResponseDetails(loginRequestDto.getUsernameOrEmail());
        ResponseCookie cookie = ResponseCookie.from("accessToken", jwtToken)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(24 * 60 * 60)
                .sameSite("Strict")
                .build();


        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(responseDto);
    }
}
