package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.security.oauth2.user.GoogleOAuth2UserInfo;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private OAuth2AccountService oAuth2AccountService;

    @Mock
    private HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    private OAuth2AuthenticationSuccessHandler successHandler;
    private User sampleUser;
    private OidcIdToken sampleIdToken;
    private OidcUserInfo sampleOidcUserInfo;

    @BeforeEach
    void setUp() {
        successHandler = new OAuth2AuthenticationSuccessHandler(
                oAuth2AccountService,
                authorizationRequestRepository
        );
        ReflectionTestUtils.setField(successHandler, "frontendUrl", "http://localhost:5173");

        Role userRole = Role.builder().id(UUID.randomUUID()).roleName(RoleType.USER).build();
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("johndoe")
                .email("john@example.com")
                .roles(Set.of(userRole))
                .build();

        sampleIdToken = new OidcIdToken(
                "token-value-123",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("sub", "google-123", "email", "john@example.com", "name", "John Doe", "email_verified", true)
        );
        sampleOidcUserInfo = new OidcUserInfo(sampleIdToken.getClaims());
    }

    @Test
    @DisplayName("Should successfully handle Google CustomOidcUser principal when authenticated")
    void shouldHandleGoogleCustomOidcUserWhenAuthenticated() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        GoogleOAuth2UserInfo googleUserInfo = new GoogleOAuth2UserInfo(sampleIdToken.getClaims());
        CustomOAuth2User baseUser = CustomOAuth2User.authenticated(googleUserInfo, sampleUser);
        CustomOidcUser customOidcUser = new CustomOidcUser(baseUser, sampleIdToken, sampleOidcUserInfo);

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                customOidcUser,
                customOidcUser.getAuthorities(),
                "google"
        );

        when(oAuth2AccountService.createExchangeCode(sampleUser.getId())).thenReturn("exch-code-google");

        successHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:5173/oauth2/redirect?code=exch-code-google");
        verify(authorizationRequestRepository).removeAuthorizationRequestCookies(request, response);
        verify(oAuth2AccountService).createExchangeCode(sampleUser.getId());
    }

    @Test
    @DisplayName("Regression test: Should resolve Google DefaultOidcUser principal without ClassCastException")
    void shouldResolveGoogleDefaultOidcUserPrincipal() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        DefaultOidcUser defaultOidcUser = new DefaultOidcUser(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                sampleIdToken,
                sampleOidcUserInfo,
                "sub"
        );

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                defaultOidcUser,
                defaultOidcUser.getAuthorities(),
                "google"
        );

        GoogleOAuth2UserInfo expectedUserInfo = new GoogleOAuth2UserInfo(sampleIdToken.getClaims());
        CustomOAuth2User resolvedUser = CustomOAuth2User.authenticated(expectedUserInfo, sampleUser);

        when(oAuth2AccountService.processOAuth2User(any(), eq(AuthProvider.GOOGLE)))
                .thenReturn(resolvedUser);
        when(oAuth2AccountService.createExchangeCode(sampleUser.getId()))
                .thenReturn("exch-code-from-default-oidc");

        // Execute without throwing ClassCastException
        successHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:5173/oauth2/redirect?code=exch-code-from-default-oidc");
        verify(oAuth2AccountService).processOAuth2User(any(), eq(AuthProvider.GOOGLE));
        verify(authorizationRequestRepository).removeAuthorizationRequestCookies(request, response);
    }

    @Test
    @DisplayName("Should handle Google DefaultOidcUser when account linking is required")
    void shouldHandleGoogleDefaultOidcUserWhenLinkingRequired() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        DefaultOidcUser defaultOidcUser = new DefaultOidcUser(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                sampleIdToken,
                sampleOidcUserInfo,
                "sub"
        );

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                defaultOidcUser,
                defaultOidcUser.getAuthorities(),
                "google"
        );

        GoogleOAuth2UserInfo googleUserInfo = new GoogleOAuth2UserInfo(sampleIdToken.getClaims());
        CustomOAuth2User linkRequiredUser = CustomOAuth2User.linkRequired(googleUserInfo, sampleUser);

        when(oAuth2AccountService.processOAuth2User(any(), eq(AuthProvider.GOOGLE)))
                .thenReturn(linkRequiredUser);
        when(oAuth2AccountService.createLinkToken(any())).thenReturn("link-token-google");

        successHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl())
                .contains("http://localhost:5173/oauth2/redirect")
                .contains("action=link_required")
                .contains("provider=google")
                .contains("email=john@example.com")
                .contains("token=link-token-google");

        verify(authorizationRequestRepository).removeAuthorizationRequestCookies(request, response);
    }

    @Test
    @DisplayName("Should successfully handle GitHub CustomOAuth2User principal when authenticated")
    void shouldHandleGithubCustomOAuth2UserWhenAuthenticated() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        Map<String, Object> githubAttrs = Map.of(
                "id", 12345,
                "login", "octocat",
                "email", "octo@github.com",
                "name", "The Octocat"
        );
        com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo githubUserInfo =
                new com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo(githubAttrs);

        CustomOAuth2User customUser = CustomOAuth2User.authenticated(githubUserInfo, sampleUser);

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                customUser,
                customUser.getAuthorities(),
                "github"
        );

        when(oAuth2AccountService.createExchangeCode(sampleUser.getId())).thenReturn("exch-code-github");

        successHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:5173/oauth2/redirect?code=exch-code-github");
        verify(authorizationRequestRepository).removeAuthorizationRequestCookies(request, response);
    }

    @Test
    @DisplayName("Should resolve GitHub DefaultOAuth2User principal via OAuth2AccountService")
    void shouldResolveGithubDefaultOAuth2UserPrincipal() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        Map<String, Object> githubAttrs = Map.of(
                "id", 12345,
                "login", "octocat",
                "email", "octo@github.com",
                "name", "The Octocat"
        );

        DefaultOAuth2User defaultOAuth2User = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                githubAttrs,
                "id"
        );

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                defaultOAuth2User,
                defaultOAuth2User.getAuthorities(),
                "github"
        );

        com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo githubUserInfo =
                new com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo(githubAttrs);
        CustomOAuth2User resolvedUser = CustomOAuth2User.authenticated(githubUserInfo, sampleUser);

        when(oAuth2AccountService.processOAuth2User(any(), eq(AuthProvider.GITHUB)))
                .thenReturn(resolvedUser);
        when(oAuth2AccountService.createExchangeCode(sampleUser.getId())).thenReturn("exch-code-gh-default");

        successHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:5173/oauth2/redirect?code=exch-code-gh-default");
        verify(oAuth2AccountService).processOAuth2User(any(), eq(AuthProvider.GITHUB));
        verify(authorizationRequestRepository).removeAuthorizationRequestCookies(request, response);
    }

    @Test
    @DisplayName("Should handle GitHub CustomOAuth2User when linking is required")
    void shouldHandleGithubCustomOAuth2UserWhenLinkingRequired() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        Map<String, Object> githubAttrs = Map.of(
                "id", 12345,
                "login", "octocat",
                "email", "octo@github.com",
                "name", "The Octocat"
        );
        com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo githubUserInfo =
                new com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo(githubAttrs);

        CustomOAuth2User customUser = CustomOAuth2User.linkRequired(githubUserInfo, sampleUser);

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                customUser,
                customUser.getAuthorities(),
                "github"
        );

        when(oAuth2AccountService.createLinkToken(any())).thenReturn("link-token-github");

        successHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl())
                .contains("http://localhost:5173/oauth2/redirect")
                .contains("action=link_required")
                .contains("provider=github")
                .contains("email=octo@github.com")
                .contains("token=link-token-github");

        verify(authorizationRequestRepository).removeAuthorizationRequestCookies(request, response);
    }
}
