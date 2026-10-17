package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
public class CustomOAuth2User implements OAuth2User, Serializable {

    private final OAuth2UserInfo oAuth2UserInfo;
    private final User user;
    private final OAuthFlowStatus flowStatus;
    private final Collection<? extends GrantedAuthority> authorities;
    private final Map<String, Object> attributes;

    public CustomOAuth2User(OAuth2UserInfo oAuth2UserInfo, User user, OAuthFlowStatus flowStatus, Collection<? extends GrantedAuthority> authorities) {
        this.oAuth2UserInfo = oAuth2UserInfo;
        this.user = user;
        this.flowStatus = flowStatus;
        this.attributes = oAuth2UserInfo != null ? oAuth2UserInfo.getAttributes() : Map.of();
        this.authorities = authorities != null ? authorities : List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    public static CustomOAuth2User authenticated(OAuth2UserInfo oAuth2UserInfo, User user) {
        Collection<? extends GrantedAuthority> auths = user != null && user.getRoles() != null
                ? user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getRoleName().name()))
                .collect(Collectors.toList())
                : List.of(new SimpleGrantedAuthority("ROLE_USER"));

        return new CustomOAuth2User(oAuth2UserInfo, user, OAuthFlowStatus.AUTHENTICATED, auths);
    }

    public static CustomOAuth2User linkRequired(OAuth2UserInfo oAuth2UserInfo, User existingUser) {
        return new CustomOAuth2User(oAuth2UserInfo, existingUser, OAuthFlowStatus.LINK_REQUIRED, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return oAuth2UserInfo != null && oAuth2UserInfo.getId() != null
                ? oAuth2UserInfo.getId()
                : (user != null ? user.getHotdropId() : (oAuth2UserInfo != null ? oAuth2UserInfo.getEmail() : "user"));
    }
}
