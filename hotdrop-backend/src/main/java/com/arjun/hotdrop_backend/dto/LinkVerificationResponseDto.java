package com.arjun.hotdrop_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkVerificationResponseDto {
    private boolean isLive;
    private String url;
    private String message;
}