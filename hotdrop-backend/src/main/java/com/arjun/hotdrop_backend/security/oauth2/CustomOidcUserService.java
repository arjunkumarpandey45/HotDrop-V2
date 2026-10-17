package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfoFactory;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final OAuth2AccountService oAuth2AccountService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        log.info("Loading OIDC user for provider registration: {}", registrationId);

        Map<String, Object> attributes = new HashMap<>(oidcUser.getAttributes());

        if ("google".equalsIgnoreCase(registrationId)) {
            processGoogleAttributes(attributes);
        }

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_email"),
                    "Email not found from OIDC provider."
            );
        }

        CustomOAuth2User customOAuth2User = oAuth2AccountService.processOAuth2User(userInfo, provider);

        return new CustomOidcUser(customOAuth2User, oidcUser.getIdToken(), oidcUser.getUserInfo());
    }

    private void processGoogleAttributes(Map<String, Object> attributes) {
        Object emailVerified = attributes.get("email_verified");
        boolean isVerified = false;
        if (emailVerified instanceof Boolean b) {
            isVerified = b;
        } else if (emailVerified != null) {
            isVerified = Boolean.parseBoolean(String.valueOf(emailVerified));
        }

        if (!isVerified) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("unverified_google_email"),
                    "Your Google email is not verified. Please verify your email with Google."
            );
        }
    }
}
