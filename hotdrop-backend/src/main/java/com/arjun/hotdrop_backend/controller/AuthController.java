package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.LoginRequestDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.RegisterRequestDto;
import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }
}
