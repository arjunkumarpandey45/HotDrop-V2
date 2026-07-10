package com.arjun.hotdrop_backend.controller;
import com.arjun.hotdrop_backend.dto.RegisterRequestDto;
import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> signup(@RequestBody RegisterRequestDto registerRequestDto){
        return ResponseEntity.ok(authService.register(registerRequestDto));
    }
}
