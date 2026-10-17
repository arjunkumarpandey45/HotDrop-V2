package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OAuthExchangeRequestDto {

    @NotBlank(message = "Authorization exchange code is required")
    private String code;
}
