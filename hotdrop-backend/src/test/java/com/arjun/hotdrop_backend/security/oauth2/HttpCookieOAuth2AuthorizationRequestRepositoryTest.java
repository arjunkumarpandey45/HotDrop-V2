package com.arjun.hotdrop_backend.security.oauth2;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class HttpCookieOAuth2AuthorizationRequestRepositoryTest {

    private HttpCookieOAuth2AuthorizationRequestRepository repository;

    @BeforeEach
    void setUp() {
        repository = new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    @Test
    @DisplayName("Should save and load authorization request from cookie")
    void shouldSaveAndLoadAuthorizationRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client-id")
                .redirectUri("http://localhost:8080/login/oauth2/code/google")
                .scopes(Set.of("openid", "profile", "email"))
                .state("state-xyz-123")
                .additionalParameters(Map.of("prompt", "consent"))
                .build();

        repository.saveAuthorizationRequest(authRequest, request, response);

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).contains(HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        assertThat(setCookieHeader).contains("HttpOnly");
        assertThat(setCookieHeader).contains("SameSite=Lax");

        // Simulate incoming request with that cookie
        String cookieValue = extractCookieValue(setCookieHeader);
        request.setCookies(new Cookie(HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, cookieValue));

        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(request);
        assertThat(loaded).isNotNull();
        assertThat(loaded.getClientId()).isEqualTo("test-client-id");
        assertThat(loaded.getState()).isEqualTo("state-xyz-123");
        assertThat(loaded.getScopes()).containsExactlyInAnyOrder("openid", "profile", "email");
    }

    @Test
    @DisplayName("Should safely reject deserialization of unauthorized classes via ObjectInputFilter")
    void shouldRejectDeserializationOfUnauthorizedClasses() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();

        // Serialize an unauthorized class (e.g. java.lang.ProcessBuilder or custom non-whitelisted object)
        java.awt.Point point = new java.awt.Point(10, 20);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(point);
            oos.flush();
        }
        String serialized = Base64.getUrlEncoder().encodeToString(baos.toByteArray());

        request.setCookies(new Cookie(HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, serialized));

        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(request);
        assertThat(loaded).isNull();
    }

    @Test
    @DisplayName("Should return null when cookie is missing or malformed")
    void shouldReturnNullWhenCookieIsMissingOrMalformed() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        assertThat(repository.loadAuthorizationRequest(request)).isNull();

        request.setCookies(new Cookie(HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, "not-valid-base64-!@#$"));
        assertThat(repository.loadAuthorizationRequest(request)).isNull();
    }

    @Test
    @DisplayName("Should delete authorization request cookie when request is removed")
    void shouldDeleteCookieWhenRemoved() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        repository.removeAuthorizationRequestCookies(request, response);

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).contains("Max-Age=0");
    }

    @Test
    @DisplayName("Should set secure cookie when request is HTTPS")
    void shouldSetSecureCookieWhenHttps() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSecure(true);
        MockHttpServletResponse response = new MockHttpServletResponse();

        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client-id")
                .redirectUri("https://hotdrop.app/login/oauth2/code/google")
                .state("secure-state")
                .build();

        repository.saveAuthorizationRequest(authRequest, request, response);

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).contains("Secure");
    }

    private String extractCookieValue(String setCookieHeader) {
        String name = HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME + "=";
        int start = setCookieHeader.indexOf(name);
        if (start == -1) return null;
        int end = setCookieHeader.indexOf(";", start);
        if (end == -1) end = setCookieHeader.length();
        return setCookieHeader.substring(start + name.length(), end);
    }
}
