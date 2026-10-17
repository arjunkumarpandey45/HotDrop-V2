package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.security.oauth2.user.GithubOAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.GoogleOAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfoFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OAuth2UserInfoFactoryTest {

    @Test
    @DisplayName("Should extract Google OAuth2 user info correctly")
    void shouldExtractGoogleOAuth2UserInfo() {
        Map<String, Object> attributes = Map.of(
                "sub", "google-12345",
                "name", "John Doe",
                "given_name", "John",
                "family_name", "Doe",
                "email", "john.doe@example.com",
                "picture", "https://example.com/avatar.jpg",
                "email_verified", true
        );

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo("google", attributes);

        assertThat(userInfo).isInstanceOf(GoogleOAuth2UserInfo.class);
        assertThat(userInfo.getId()).isEqualTo("google-12345");
        assertThat(userInfo.getName()).isEqualTo("John Doe");
        assertThat(userInfo.getFirstName()).isEqualTo("John");
        assertThat(userInfo.getLastName()).isEqualTo("Doe");
        assertThat(userInfo.getEmail()).isEqualTo("john.doe@example.com");
        assertThat(userInfo.getImageUrl()).isEqualTo("https://example.com/avatar.jpg");
        assertThat(userInfo.isEmailVerified()).isTrue();
        assertThat(userInfo.getProvider()).isEqualTo(AuthProvider.GOOGLE);
    }

    @Test
    @DisplayName("Should extract GitHub OAuth2 user info correctly")
    void shouldExtractGithubOAuth2UserInfo() {
        Map<String, Object> attributes = Map.of(
                "id", 98765,
                "login", "johndoe_dev",
                "name", "John Doe",
                "email", "john.github@example.com",
                "avatar_url", "https://github.com/avatar.jpg"
        );

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo("github", attributes);

        assertThat(userInfo).isInstanceOf(GithubOAuth2UserInfo.class);
        assertThat(userInfo.getId()).isEqualTo("98765");
        assertThat(userInfo.getName()).isEqualTo("John Doe");
        assertThat(userInfo.getEmail()).isEqualTo("john.github@example.com");
        assertThat(userInfo.getImageUrl()).isEqualTo("https://github.com/avatar.jpg");
        assertThat(userInfo.isEmailVerified()).isTrue();
        assertThat(userInfo.getProvider()).isEqualTo(AuthProvider.GITHUB);
    }

    @Test
    @DisplayName("Should fallback to login username when GitHub name is empty")
    void shouldFallbackToLoginWhenGithubNameIsNull() {
        Map<String, Object> attributes = Map.of(
                "id", 12345,
                "login", "octocat",
                "email", "octo@example.com"
        );

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo("github", attributes);

        assertThat(userInfo.getName()).isEqualTo("octocat");
        assertThat(userInfo.getFirstName()).isEqualTo("octocat");
        assertThat(userInfo.getLastName()).isEmpty();
    }

    @Test
    @DisplayName("Should throw OAuth2AuthenticationException when provider is unsupported")
    void shouldThrowExceptionForUnsupportedProvider() {
        Map<String, Object> attributes = Map.of("id", "123");

        assertThatThrownBy(() -> OAuth2UserInfoFactory.getOAuth2UserInfo("facebook", attributes))
                .isInstanceOf(org.springframework.security.oauth2.core.OAuth2AuthenticationException.class)
                .hasMessageContaining("facebook is not supported");
    }
}
