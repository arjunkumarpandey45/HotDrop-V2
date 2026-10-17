package com.arjun.hotdrop_backend.dto;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthAccountResponseDto {
    private AuthProvider provider;
    private String providerUserId;
    private String email;
    private LocalDateTime linkedAt;
}
