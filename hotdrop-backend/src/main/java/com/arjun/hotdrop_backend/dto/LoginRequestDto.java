package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data

public class LoginRequestDto {
    @NotBlank(message = "Hotdrop Id or Email is required")
    private String hotdropIdOrEmail;
    @NotBlank(message = "Password is required")
    private String password;
}
