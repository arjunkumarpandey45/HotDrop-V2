package com.arjun.hotdrop_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDto {

    private String hotdropId;
    private String email;

    private List<String> roles;
}