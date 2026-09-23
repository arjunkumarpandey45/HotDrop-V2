package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.entity.RefreshToken;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(String hotdropId);

    RefreshToken verifyAndRotate(String tokenString);
}
