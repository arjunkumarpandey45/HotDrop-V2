package com.arjun.hotdrop_backend.security.oauth2.user;

import com.arjun.hotdrop_backend.enums.AuthProvider;

import java.util.Map;

public class GithubOAuth2UserInfo extends OAuth2UserInfo {
    private String verifiedEmail;

    public GithubOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    public GithubOAuth2UserInfo(Map<String, Object> attributes, String verifiedEmail) {
        super(attributes);
        this.verifiedEmail = verifiedEmail;
    }

    public void setVerifiedEmail(String email) {
        this.verifiedEmail = email;
    }

    @Override
    public String getId() {
        Object id = attributes.get("id");
        return id != null ? String.valueOf(id) : null;
    }

    public String getUsername() {
        return (String) attributes.get("login");
    }

    @Override
    public String getName() {
        String name = (String) attributes.get("name");
        if (name != null && !name.isBlank()) {
            return name;
        }
        return getUsername();
    }

    @Override
    public String getFirstName() {
        String name = getName();
        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split("\\s+", 2);
            return parts[0];
        }
        String login = getUsername();
        return (login != null && !login.isBlank()) ? login : "GithubUser";
    }

    @Override
    public String getLastName() {
        String name = getName();
        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split("\\s+", 2);
            return parts.length > 1 ? parts[1] : "";
        }
        return "";
    }

    @Override
    public String getEmail() {
        if (verifiedEmail != null && !verifiedEmail.isBlank()) {
            return verifiedEmail;
        }
        return (String) attributes.get("email");
    }

    @Override
    public boolean isEmailVerified() {
        if (verifiedEmail != null && !verifiedEmail.isBlank()) {
            return true;
        }
        return attributes.get("email") != null;
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("avatar_url");
    }

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.GITHUB;
    }
}
