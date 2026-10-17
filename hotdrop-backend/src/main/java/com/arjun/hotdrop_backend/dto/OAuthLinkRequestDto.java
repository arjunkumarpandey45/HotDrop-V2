package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OAuthLinkRequestDto {

    @NotBlank(message = "Link token is required")
    private String token;

    @NotBlank(message = "Password is required")
    private String password;
}
