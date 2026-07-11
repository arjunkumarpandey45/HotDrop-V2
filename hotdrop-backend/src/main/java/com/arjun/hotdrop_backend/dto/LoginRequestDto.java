package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data

public class LoginRequestDto {
    @NotBlank(message = "Username or Email is required")
    private String usernameOrEmail;
    @NotBlank(message = "Password is required")
    private String password;
}
