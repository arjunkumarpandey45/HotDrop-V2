package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomOidcUserServiceTest {

    @Mock
    private OAuth2AccountService oAuth2AccountService;

    @Mock
    private OAuth2UserService<OAuth2UserRequest, OAuth2User> mockOAuth2UserService;

    private CustomOidcUserService customOidcUserService;
    private ClientRegistration googleClientRegistration;
    private OAuth2AccessToken accessToken;

    @BeforeEach
    void setUp() {
        customOidcUserService = new CustomOidcUserService(oAuth2AccountService);
        customOidcUserService.setOauth2UserService(mockOAuth2UserService);

        googleClientRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("test-google-client-id")
                .clientSecret("test-google-client-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("sub")
                .build();

        accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "google-access-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Set.of("openid", "profile", "email")
        );
    }

    @Test
    @DisplayName("Should successfully load verified Google OIDC user and return CustomOidcUser")
    void shouldLoadVerifiedGoogleOidcUser() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "google-sub-999");
        claims.put("email", "alex@gmail.com");
        claims.put("name", "Alex Developer");
        claims.put("email_verified", true);

        OidcIdToken idToken = new OidcIdToken("token-id", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserRequest userRequest = new OidcUserRequest(googleClientRegistration, accessToken, idToken);

        OAuth2User oauth2User = new DefaultOAuth2User(List.of(), claims, "sub");
        when(mockOAuth2UserService.loadUser(any(OAuth2UserRequest.class))).thenReturn(oauth2User);

        User sampleUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("alexdev")
                .email("alex@gmail.com")
                .roles(Set.of(Role.builder().id(UUID.randomUUID()).roleName(RoleType.USER).build()))
                .build();

        CustomOAuth2User resolvedUser = CustomOAuth2User.authenticated(
                new com.arjun.hotdrop_backend.security.oauth2.user.GoogleOAuth2UserInfo(claims),
                sampleUser
        );
        when(oAuth2AccountService.processOAuth2User(any(), eq(AuthProvider.GOOGLE))).thenReturn(resolvedUser);

        OidcUser result = customOidcUserService.loadUser(userRequest);

        assertThat(result).isInstanceOf(CustomOidcUser.class);
        CustomOidcUser customOidcUser = (CustomOidcUser) result;
        assertThat(customOidcUser.getUser().getHotdropId()).isEqualTo("alexdev");
        assertThat(customOidcUser.getFlowStatus()).isEqualTo(OAuthFlowStatus.AUTHENTICATED);
        assertThat(customOidcUser.getIdToken()).isEqualTo(idToken);
        verify(oAuth2AccountService).processOAuth2User(any(), eq(AuthProvider.GOOGLE));
    }

    @Test
    @DisplayName("Should reject Google OIDC user when email is not verified")
    void shouldRejectGoogleOidcUserWhenEmailNotVerified() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "google-sub-unverified");
        claims.put("email", "unverified@gmail.com");
        claims.put("name", "Unverified User");
        claims.put("email_verified", false);

        OidcIdToken idToken = new OidcIdToken("token-id", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserRequest userRequest = new OidcUserRequest(googleClientRegistration, accessToken, idToken);

        OAuth2User oauth2User = new DefaultOAuth2User(List.of(), claims, "sub");
        when(mockOAuth2UserService.loadUser(any(OAuth2UserRequest.class))).thenReturn(oauth2User);

        assertThatThrownBy(() -> customOidcUserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Google email is not verified");

        verify(oAuth2AccountService, never()).processOAuth2User(any(), any());
    }

    @Test
    @DisplayName("Should reject Google OIDC user when email_verified claim is missing")
    void shouldRejectGoogleOidcUserWhenEmailVerifiedClaimIsMissing() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "google-sub-missing-flag");
        claims.put("email", "missingflag@gmail.com");
        claims.put("name", "Missing Flag User");

        OidcIdToken idToken = new OidcIdToken("token-id", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserRequest userRequest = new OidcUserRequest(googleClientRegistration, accessToken, idToken);

        OAuth2User oauth2User = new DefaultOAuth2User(List.of(), claims, "sub");
        when(mockOAuth2UserService.loadUser(any(OAuth2UserRequest.class))).thenReturn(oauth2User);

        assertThatThrownBy(() -> customOidcUserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Google email is not verified");

        verify(oAuth2AccountService, never()).processOAuth2User(any(), any());
    }

    @Test
    @DisplayName("Should reject Google OIDC user when email is missing")
    void shouldRejectGoogleOidcUserWhenEmailIsMissing() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "google-sub-no-email");
        claims.put("name", "No Email User");
        claims.put("email_verified", true);

        OidcIdToken idToken = new OidcIdToken("token-id", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserRequest userRequest = new OidcUserRequest(googleClientRegistration, accessToken, idToken);

        OAuth2User oauth2User = new DefaultOAuth2User(List.of(), claims, "sub");
        when(mockOAuth2UserService.loadUser(any(OAuth2UserRequest.class))).thenReturn(oauth2User);

        assertThatThrownBy(() -> customOidcUserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Email not found");

        verify(oAuth2AccountService, never()).processOAuth2User(any(), any());
    }
}
