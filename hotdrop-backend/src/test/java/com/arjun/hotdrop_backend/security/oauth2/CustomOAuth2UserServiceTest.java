package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.security.oauth2.user.GoogleOAuth2UserInfo;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.web.client.RestOperations;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private OAuth2AccountService oAuth2AccountService;

    @Mock
    private RestOperations restOperations;

    private CustomOAuth2UserService customOAuth2UserService;
    private ClientRegistration googleClientRegistration;
    private ClientRegistration githubClientRegistration;

    @BeforeEach
    void setUp() {
        customOAuth2UserService = new CustomOAuth2UserService(oAuth2AccountService);
        customOAuth2UserService.setRestOperations(restOperations);
        customOAuth2UserService.setGithubRestOperations(restOperations);

        googleClientRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("dummy-client-id")
                .clientSecret("dummy-client-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("sub")
                .build();

        githubClientRegistration = ClientRegistration.withRegistrationId("github")
                .clientId("dummy-gh-id")
                .clientSecret("dummy-gh-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://github.com/login/oauth/authorize")
                .tokenUri("https://github.com/login/oauth/access_token")
                .userInfoUri("https://api.github.com/user")
                .userNameAttributeName("id")
                .build();
    }

    @Test
    @DisplayName("Should reject unverified Google email with OAuth2AuthenticationException")
    void shouldRejectUnverifiedGoogleEmail() {
        OAuth2AccessToken token = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );
        OAuth2UserRequest userRequest = new OAuth2UserRequest(googleClientRegistration, token);

        Map<String, Object> attributes = Map.of(
                "sub", "12345",
                "email", "unverified@gmail.com",
                "email_verified", false,
                "name", "Unverified Google User"
        );

        when(restOperations.exchange(any(), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(attributes, HttpStatus.OK));

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Google email is not verified");
    }

    @Test
    @DisplayName("Should successfully load valid verified Google user and delegate to account service")
    void shouldLoadValidVerifiedGoogleUser() {
        OAuth2AccessToken token = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );
        OAuth2UserRequest userRequest = new OAuth2UserRequest(googleClientRegistration, token);

        Map<String, Object> attributes = Map.of(
                "sub", "12345",
                "email", "verified@gmail.com",
                "email_verified", true,
                "name", "Verified Google User"
        );

        when(restOperations.exchange(any(), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(attributes, HttpStatus.OK));

        CustomOAuth2User customUser = mock(CustomOAuth2User.class);
        when(oAuth2AccountService.processOAuth2User(any(), eq(AuthProvider.GOOGLE)))
                .thenReturn(customUser);

        CustomOAuth2User result = (CustomOAuth2User) customOAuth2UserService.loadUser(userRequest);

        assertThat(result).isEqualTo(customUser);
        verify(oAuth2AccountService).processOAuth2User(any(), eq(AuthProvider.GOOGLE));
    }

    @Test
    @DisplayName("Should reject Google email when email_verified is missing")
    void shouldRejectGoogleEmailWhenVerifiedFlagIsMissing() {
        OAuth2AccessToken token = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );
        OAuth2UserRequest userRequest = new OAuth2UserRequest(googleClientRegistration, token);

        Map<String, Object> attributes = Map.of(
                "sub", "12345",
                "email", "unverified@gmail.com",
                "name", "Missing Verified Flag"
        );

        when(restOperations.exchange(any(org.springframework.http.RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(attributes, HttpStatus.OK));

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Google email is not verified");
    }

    @Test
    @DisplayName("Should fetch and use verified primary email from GitHub emails API")
    void shouldFetchVerifiedEmailFromGithubEmailsApi() {
        OAuth2AccessToken token = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );
        OAuth2UserRequest userRequest = new OAuth2UserRequest(githubClientRegistration, token);

        Map<String, Object> userAttributes = Map.of(
                "id", 123456,
                "login", "octocat",
                "name", "The Octocat"
        );

        when(restOperations.exchange(any(org.springframework.http.RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(userAttributes, HttpStatus.OK));

        List<Map<String, Object>> githubEmails = List.of(
                Map.of("email", "unverified@example.com", "verified", false, "primary", false),
                Map.of("email", "octocat@github.com", "verified", true, "primary", true)
        );

        when(restOperations.exchange(
                eq("https://api.github.com/user/emails"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(githubEmails, HttpStatus.OK));

        CustomOAuth2User customUser = mock(CustomOAuth2User.class);
        when(oAuth2AccountService.processOAuth2User(any(), eq(AuthProvider.GITHUB)))
                .thenReturn(customUser);

        CustomOAuth2User result = (CustomOAuth2User) customOAuth2UserService.loadUser(userRequest);

        assertThat(result).isEqualTo(customUser);
        verify(oAuth2AccountService).processOAuth2User(any(), eq(AuthProvider.GITHUB));
    }

    @Test
    @DisplayName("Should reject GitHub user if no verified email exists on account")
    void shouldRejectGithubUserWhenNoVerifiedEmailFound() {
        OAuth2AccessToken token = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );
        OAuth2UserRequest userRequest = new OAuth2UserRequest(githubClientRegistration, token);

        Map<String, Object> userAttributes = Map.of(
                "id", 123456,
                "login", "octocat",
                "name", "The Octocat"
        );

        when(restOperations.exchange(any(org.springframework.http.RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(userAttributes, HttpStatus.OK));

        List<Map<String, Object>> githubEmails = List.of(
                Map.of("email", "unverified1@example.com", "verified", false, "primary", true),
                Map.of("email", "unverified2@example.com", "verified", false, "primary", false)
        );

        when(restOperations.exchange(
                eq("https://api.github.com/user/emails"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(githubEmails, HttpStatus.OK));

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("No verified email found on your GitHub account");
    }
}
