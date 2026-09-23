package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;

public interface AuthService {
    UserResponseDto register(RegisterRequestDto registerRequestDto);
    void reVerifyEmail(String email);
    String verifyEmail(String token);
   AuthResultDto login(LoginRequestDto loginRequestDto);

    void sendForgotPasswordOtp(ForgotPasswordRequestDto request);
    void resetPasswordWithOtp(ResetPasswordDto request);
    void logout(String accessToken, String refreshToken);

}