package com.arjun.hotdrop_backend.dto;


import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LoginResponseDto {
    private String token;
    private String type = "Bearer";
    private String username;
    private String email;
    private boolean isLoggedIn;
    private List<String> roles;
}