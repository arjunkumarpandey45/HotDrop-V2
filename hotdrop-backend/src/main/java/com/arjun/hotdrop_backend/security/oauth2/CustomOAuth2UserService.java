package com.arjun.hotdrop_backend.security.oauth2;

import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfoFactory;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service

public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final OAuth2AccountService oAuth2AccountService;
    private RestOperations restOperations = new RestTemplate();

    public CustomOAuth2UserService(OAuth2AccountService oAuth2AccountService) {
        this.oAuth2AccountService = oAuth2AccountService;
    }

    public void setGithubRestOperations(RestOperations restOperations) {
        this.restOperations = restOperations;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        log.info("Loading OAuth2 user for provider registration: {}", registrationId);

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());

        if ("github".equalsIgnoreCase(registrationId)) {
            attributes = processGithubAttributes(userRequest, attributes);
        } else if ("google".equalsIgnoreCase(registrationId)) {
            processGoogleAttributes(attributes);
        }

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_email"),
                    "Email not found from OAuth2 provider."
            );
        }

        return oAuth2AccountService.processOAuth2User(userInfo, provider);
    }

    private Map<String, Object> processGithubAttributes(OAuth2UserRequest userRequest, Map<String, Object> attributes) {
        log.info("Fetching verified emails from GitHub user/emails API.");
        String verifiedEmail = null;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(userRequest.getAccessToken().getTokenValue());
            headers.set("Accept", "application/vnd.github+json");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<List<Map<String, Object>>> response = restOperations.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            List<Map<String, Object>> emails = response.getBody();
            if (emails != null && !emails.isEmpty()) {
                // Find verified primary email
                verifiedEmail = emails.stream()
                        .filter(e -> Boolean.TRUE.equals(e.get("verified")) && Boolean.TRUE.equals(e.get("primary")))
                        .map(e -> (String) e.get("email"))
                        .findFirst()
                        // Fallback to any verified email
                        .orElseGet(() -> emails.stream()
                                .filter(e -> Boolean.TRUE.equals(e.get("verified")))
                                .map(e -> (String) e.get("email"))
                                .findFirst()
                                .orElse(null)
                        );
            }
        } catch (Exception e) {
            log.error("Failed to fetch emails from GitHub API", e);
        }

        if (verifiedEmail != null && !verifiedEmail.isBlank()) {
            attributes.put("email", verifiedEmail);
            log.info("Retrieved verified email for GitHub user: {}", verifiedEmail);
        } else {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("unverified_github_email"),
                    "No verified email found on your GitHub account. Please verify an email on GitHub and retry."
            );
        }

        return attributes;
    }

    private void processGoogleAttributes(Map<String, Object> attributes) {
        Object emailVerified = attributes.get("email_verified");
        boolean isVerified = false;
        if (emailVerified instanceof Boolean b) {
            isVerified = b;
        } else if (emailVerified != null) {
            isVerified = Boolean.parseBoolean(String.valueOf(emailVerified));
        }

        if (!isVerified) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("unverified_google_email"),
                    "Your Google email is not verified. Please verify your email with Google."
            );
        }
    }
}
