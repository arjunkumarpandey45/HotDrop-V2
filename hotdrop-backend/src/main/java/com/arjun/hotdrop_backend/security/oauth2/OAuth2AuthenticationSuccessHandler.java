package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfoFactory;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    private final OAuth2AccountService oAuth2AccountService;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        CustomOAuth2User customOAuth2User = resolveCustomOAuth2User(authentication);
        String targetUrl;

        if (customOAuth2User.getFlowStatus() == OAuthFlowStatus.AUTHENTICATED) {
            String code = oAuth2AccountService.createExchangeCode(customOAuth2User.getUser().getId());
            targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                    .queryParam("code", code)
                    .build().toUriString();
            log.info("OAuth2 authentication successful. Redirecting user {} with exchange code",
                    customOAuth2User.getUser().getHotdropId());
        } else {
            // LINK_REQUIRED
            AuthProvider provider = customOAuth2User.getOAuth2UserInfo().getProvider();
            OAuthLinkData linkData = OAuthLinkData.builder()
                    .userId(customOAuth2User.getUser().getId())
                    .provider(provider)
                    .providerUserId(customOAuth2User.getOAuth2UserInfo().getId())
                    .email(customOAuth2User.getOAuth2UserInfo().getEmail())
                    .build();

            String token = oAuth2AccountService.createLinkToken(linkData);
            targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                    .queryParam("action", "link_required")
                    .queryParam("provider", provider.name().toLowerCase())
                    .queryParam("email", customOAuth2User.getOAuth2UserInfo().getEmail())
                    .queryParam("token", token)
                    .build().toUriString();

            log.info("OAuth2 account linking required for email {}. Redirecting to link confirmation.",
                    customOAuth2User.getOAuth2UserInfo().getEmail());
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private CustomOAuth2User resolveCustomOAuth2User(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomOAuth2User customOAuth2User) {
            return customOAuth2User;
        }

        if (principal instanceof OAuth2User oAuth2User) {
            log.info("Resolving user from standard OAuth2 principal: {}", principal.getClass().getName());

            String registrationId = null;
            if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
                registrationId = oauthToken.getAuthorizedClientRegistrationId();
            }

            Map<String, Object> attributes = oAuth2User.getAttributes();
            if (registrationId == null || registrationId.isBlank()) {
                if (attributes.containsKey("sub")) {
                    registrationId = "google";
                } else {
                    registrationId = "github";
                }
            }

            AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
            OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

            if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
                throw new IllegalStateException("Email not found from OAuth2 provider attributes.");
            }

            CustomOAuth2User resolved = oAuth2AccountService.processOAuth2User(userInfo, provider);
            if (principal instanceof OidcUser oidcUser) {
                return new CustomOidcUser(resolved, oidcUser.getIdToken(), oidcUser.getUserInfo());
            }
            return resolved;
        }

        throw new IllegalStateException("Unsupported authentication principal type: "
                + (principal != null ? principal.getClass().getName() : "null"));
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}
