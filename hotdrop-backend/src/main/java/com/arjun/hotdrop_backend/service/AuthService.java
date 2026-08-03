package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;

public interface AuthService {
    UserResponseDto register(RegisterRequestDto registerRequestDto);
    String verifyEmail(String token);
    String login(LoginRequestDto loginRequestDto);
    LoginResponseDto getLoginResponseDetails(String hotdropIdOrEmail);
    void sendForgotPasswordOtp(ForgotPasswordRequestDto request);
    void resetPasswordWithOtp(ResetPasswordDto request);
    void logout(String refreshToken);
}