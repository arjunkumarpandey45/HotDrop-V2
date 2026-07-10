package com.arjun.hotdrop_backend.dto;

import lombok.Data;

@Data

public class LoginRequestDto {
    private String email;

    private String password;
}
