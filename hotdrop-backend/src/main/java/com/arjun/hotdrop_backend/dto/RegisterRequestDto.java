package com.arjun.hotdrop_backend.dto;

import lombok.Data;

@Data
public class RegisterRequestDto {
    private String fullName;

    private String username;

    private String email;

    private String password;
}
