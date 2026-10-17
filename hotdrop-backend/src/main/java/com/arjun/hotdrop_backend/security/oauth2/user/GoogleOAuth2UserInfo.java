package com.arjun.hotdrop_backend.security.oauth2.user;

import com.arjun.hotdrop_backend.enums.AuthProvider;

import java.util.Map;

public class GoogleOAuth2UserInfo extends OAuth2UserInfo {

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getFirstName() {
        String givenName = (String) attributes.get("given_name");
        if (givenName != null && !givenName.isBlank()) {
            return givenName.trim();
        }
        String name = getName();
        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split("\\s+", 2);
            return parts[0];
        }
        return "GoogleUser";
    }

    @Override
    public String getLastName() {
        String familyName = (String) attributes.get("family_name");
        if (familyName != null && !familyName.isBlank()) {
            return familyName.trim();
        }
        String name = getName();
        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split("\\s+", 2);
            return parts.length > 1 ? parts[1] : "";
        }
        return "";
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public boolean isEmailVerified() {
        Object verified = attributes.get("email_verified");
        if (verified instanceof Boolean b) {
            return b;
        }
        if (verified instanceof String s) {
            return Boolean.parseBoolean(s);
        }
        return false;
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("picture");
    }

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.GOOGLE;
    }
}
