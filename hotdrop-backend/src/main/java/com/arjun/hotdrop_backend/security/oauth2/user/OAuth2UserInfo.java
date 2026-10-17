package com.arjun.hotdrop_backend.security.oauth2.user;

import com.arjun.hotdrop_backend.enums.AuthProvider;

import java.util.Map;

public abstract class OAuth2UserInfo {
    protected Map<String, Object> attributes;

    protected OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public abstract String getId();

    public abstract String getName();

    public abstract String getFirstName();

    public abstract String getLastName();

    public abstract String getEmail();

    public abstract boolean isEmailVerified();

    public abstract String getImageUrl();

    public abstract AuthProvider getProvider();
}
