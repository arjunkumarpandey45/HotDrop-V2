package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthLinkData implements Serializable {
    private UUID userId;
    private AuthProvider provider;
    private String providerUserId;
    private String email;
}
