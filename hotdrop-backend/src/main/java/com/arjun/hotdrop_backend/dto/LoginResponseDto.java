package com.arjun.hotdrop_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LoginResponseDto {

    private String hotdropId;
    private String email;

    private List<String> roles;
}