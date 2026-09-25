package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.AuthResultDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.Cookie;

@Component
public class AuthMapper {

    public LoginResponseDto toLoginResponseDto(String hotdropId, String email, java.util.List<String> roles) {
        return LoginResponseDto.builder()
                .hotdropId(hotdropId)
                .email(email)
                .roles(roles)
                .build();
    }

    public AuthResultDto toAuthResultDto(String accessToken, String refreshToken, LoginResponseDto userDetails) {
        return AuthResultDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userDetails(userDetails)
                .build();
    }
}

