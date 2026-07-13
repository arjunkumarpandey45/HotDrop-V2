package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class LinkVerificationRequestDto {
    @NotBlank(message = "URL cannot be blank.")
    private String url;
}
