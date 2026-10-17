package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Collection;
import java.util.Map;

@Getter
public class CustomOidcUser extends CustomOAuth2User implements OidcUser {

    private final OidcIdToken idToken;
    private final OidcUserInfo oidcUserInfo;

    public CustomOidcUser(OAuth2UserInfo userInfo,
                          User user,
                          OAuthFlowStatus flowStatus,
                          Collection<? extends GrantedAuthority> authorities,
                          OidcIdToken idToken,
                          OidcUserInfo oidcUserInfo) {
        super(userInfo, user, flowStatus, authorities);
        this.idToken = idToken;
        this.oidcUserInfo = oidcUserInfo;
    }

    public CustomOidcUser(CustomOAuth2User customOAuth2User, OidcIdToken idToken, OidcUserInfo oidcUserInfo) {
        super(customOAuth2User.getOAuth2UserInfo(),
                customOAuth2User.getUser(),
                customOAuth2User.getFlowStatus(),
                customOAuth2User.getAuthorities());
        this.idToken = idToken;
        this.oidcUserInfo = oidcUserInfo;
    }

    @Override
    public Map<String, Object> getClaims() {
        return idToken != null ? idToken.getClaims() : getAttributes();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return oidcUserInfo;
    }

    @Override
    public OidcIdToken getIdToken() {
        return idToken;
    }
}
