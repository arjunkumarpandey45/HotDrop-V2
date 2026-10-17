package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.AuthResultDto;
import com.arjun.hotdrop_backend.dto.LinkedAccountsSummaryDto;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.security.oauth2.CustomOAuth2User;
import com.arjun.hotdrop_backend.security.oauth2.OAuthLinkData;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;

import java.util.UUID;

public interface OAuth2AccountService {

    CustomOAuth2User processOAuth2User(OAuth2UserInfo userInfo, AuthProvider provider);

    String createExchangeCode(UUID userId);

    String createLinkToken(OAuthLinkData linkData);

    AuthResultDto exchangeCode(String code);

    AuthResultDto linkAccountWithPassword(String token, String password);

    void unlinkAccount(String hotdropId, AuthProvider provider);

    LinkedAccountsSummaryDto getLinkedAccountsSummary(String hotdropId);
}
