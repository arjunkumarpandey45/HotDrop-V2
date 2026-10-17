package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.dto.AuthResultDto;
import com.arjun.hotdrop_backend.dto.LinkedAccountsSummaryDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.OAuthAccountResponseDto;
import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.entity.UserOAuthAccount;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.mapper.AuthMapper;
import com.arjun.hotdrop_backend.repository.RoleRepo;
import com.arjun.hotdrop_backend.repository.UserOAuthAccountRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.security.oauth2.CustomOAuth2User;
import com.arjun.hotdrop_backend.security.oauth2.OAuthLinkData;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import com.arjun.hotdrop_backend.service.JwtService;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import com.arjun.hotdrop_backend.service.RefreshTokenService;
import com.arjun.hotdrop_backend.utils.MaskUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuth2AccountServiceImpl implements OAuth2AccountService {

    private static final String EXCHANGE_CODE_PREFIX = "oauth2:code:";
    private static final Duration EXCHANGE_CODE_TTL = Duration.ofSeconds(60);

    private static final String LINK_TOKEN_PREFIX = "oauth2:link:";
    private static final Duration LINK_TOKEN_TTL = Duration.ofMinutes(5);

    private final UserOAuthAccountRepo userOAuthAccountRepo;
    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthMapper authMapper;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CustomOAuth2User processOAuth2User(OAuth2UserInfo userInfo, AuthProvider provider) {
        String providerUserId = userInfo.getId();
        String email = userInfo.getEmail() != null ? userInfo.getEmail().trim().toLowerCase() : null;

        log.info("Processing OAuth2 user from provider: {}, providerUserId: {}, email: {}",
                provider, providerUserId, email != null ? MaskUtils.maskEmail(email) : "null");

        // Case A: UserOAuthAccount exists for (provider, providerUserId)
        Optional<UserOAuthAccount> oauthAccountOpt = userOAuthAccountRepo.findByProviderAndProviderUserId(provider, providerUserId);
        if (oauthAccountOpt.isPresent()) {
            User existingUser = oauthAccountOpt.get().getUser();
            if (existingUser.isBanned()) {
                log.warn("Blocked login attempt for banned user: {}", existingUser.getHotdropId());
                throw new IllegalStateException("Your account has been banned.");
            }

            // Sync profile picture if currently missing
            if ((existingUser.getProfileImageUrl() == null || existingUser.getProfileImageUrl().isBlank())
                    && userInfo.getImageUrl() != null && !userInfo.getImageUrl().isBlank()) {
                existingUser.setProfileImageUrl(userInfo.getImageUrl());
                userRepo.save(existingUser);
            }

            log.info("Case A: OAuth account matched existing link for user: {}", existingUser.getHotdropId());
            return CustomOAuth2User.authenticated(userInfo, existingUser);
        }

        // Case B: Existing HotDrop account with matching email
        if (email != null) {
            Optional<User> existingUserOpt = userRepo.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();
                if (existingUser.isBanned()) {
                    log.warn("Blocked link attempt for banned user: {}", existingUser.getHotdropId());
                    throw new IllegalStateException("Your account has been banned.");
                }

                log.info("Case B: Existing user with email {} found. Requiring account linking.", MaskUtils.maskEmail(email));
                return CustomOAuth2User.linkRequired(userInfo, existingUser);
            }
        }

        // Case C: Auto-provision new User
        log.info("Case C: No account found for email {}. Auto-provisioning new user.", email != null ? MaskUtils.maskEmail(email) : "unknown");
        Role userRole = roleRepo.findByRoleName(RoleType.USER)
                .orElseThrow(() -> new ResourceNotFoundException("Default role 'USER' not found."));

        String hotdropId = generateUniqueHotdropId(userInfo);
        String[] nameParts = parseName(userInfo.getName(), hotdropId);

        User newUser = User.builder()
                .hotdropId(hotdropId)
                .email(email)
                .firstName(nameParts[0])
                .lastName(nameParts[1])
                .password(null)
                .emailVerified(true)
                .authProvider(provider)
                .profileImageUrl(userInfo.getImageUrl())
                .roles(Set.of(userRole))
                .build();

        User savedUser = userRepo.save(newUser);

        UserOAuthAccount newOAuthAccount = UserOAuthAccount.builder()
                .user(savedUser)
                .provider(provider)
                .providerUserId(providerUserId)
                .email(email)
                .build();

        userOAuthAccountRepo.save(newOAuthAccount);

        log.info("Provisioned new user {} with {} OAuth account", savedUser.getHotdropId(), provider);
        return CustomOAuth2User.authenticated(userInfo, savedUser);
    }

    @Override
    public String createExchangeCode(UUID userId) {
        String code = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(EXCHANGE_CODE_PREFIX + code, userId.toString(), EXCHANGE_CODE_TTL);
        log.debug("Created OAuth exchange code for user {}", userId);
        return code;
    }

    @Override
    public String createLinkToken(OAuthLinkData linkData) {
        String token = UUID.randomUUID().toString();
        try {
            String json = objectMapper.writeValueAsString(linkData);
            redisTemplate.opsForValue().set(LINK_TOKEN_PREFIX + token, json, LINK_TOKEN_TTL);
            log.debug("Created OAuth link token for user {}", linkData.getUserId());
            return token;
        } catch (Exception e) {
            log.error("Failed to serialize OAuth link data", e);
            throw new RuntimeException("Could not initiate account linking", e);
        }
    }

    @Override
    @Transactional
    public AuthResultDto exchangeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Authorization exchange code is required.");
        }

        String key = EXCHANGE_CODE_PREFIX + code;
        String userIdStr = redisTemplate.opsForValue().getAndDelete(key);
        if (userIdStr == null) {
            log.warn("OAuth exchange failed: code expired or invalid.");
            throw new IllegalArgumentException("Invalid or expired authorization code.");
        }

        UUID userId = UUID.fromString(userIdStr);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.isBanned()) {
            log.warn("Login blocked: user {} is banned.", user.getHotdropId());
            throw new IllegalStateException("Your account has been banned.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepo.save(user);

        String accessToken = jwtService.generateTokenFromHotdropId(user.getHotdropId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getHotdropId());

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .toList();

        LoginResponseDto loginResponse = authMapper.toLoginResponseDto(user.getHotdropId(), user.getEmail(), roles);
        log.info("OAuth exchange completed successfully for user: {}", user.getHotdropId());

        return authMapper.toAuthResultDto(accessToken, refreshToken.getToken(), loginResponse);
    }

    @Override
    @Transactional
    public AuthResultDto linkAccountWithPassword(String token, String password) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Link token is required.");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }

        String key = LINK_TOKEN_PREFIX + token;
        String json = redisTemplate.opsForValue().getAndDelete(key);
        if (json == null) {
            log.warn("OAuth link failed: token expired or invalid.");
            throw new IllegalArgumentException("Invalid or expired linking token. Please try signing in again.");
        }

        OAuthLinkData linkData;
        try {
            linkData = objectMapper.readValue(json, OAuthLinkData.class);
        } catch (Exception e) {
            log.error("Failed to deserialize link token data", e);
            throw new IllegalArgumentException("Corrupted link token session.");
        }

        User user = userRepo.findById(linkData.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.isBanned()) {
            log.warn("Link blocked: user {} is banned.", user.getHotdropId());
            throw new IllegalStateException("Your account has been banned.");
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            log.warn("Link blocked: user {} has no password set.", user.getHotdropId());
            throw new IllegalStateException("This account does not have a password set. Please log in with your primary social account.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Account link failed: invalid password for user {}", user.getHotdropId());
            throw new BadCredentialsException("Invalid password. Linking failed.");
        }

        if (!userOAuthAccountRepo.existsByProviderAndProviderUserId(linkData.getProvider(), linkData.getProviderUserId())) {
            UserOAuthAccount account = UserOAuthAccount.builder()
                    .user(user)
                    .provider(linkData.getProvider())
                    .providerUserId(linkData.getProviderUserId())
                    .email(linkData.getEmail())
                    .build();
            userOAuthAccountRepo.save(account);
            log.info("Successfully linked provider {} to user {}", linkData.getProvider(), user.getHotdropId());
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepo.save(user);

        String accessToken = jwtService.generateTokenFromHotdropId(user.getHotdropId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getHotdropId());

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getRoleName().name())
                .toList();

        LoginResponseDto loginResponse = authMapper.toLoginResponseDto(user.getHotdropId(), user.getEmail(), roles);
        return authMapper.toAuthResultDto(accessToken, refreshToken.getToken(), loginResponse);
    }

    @Override
    @Transactional
    public void unlinkAccount(String hotdropId, AuthProvider provider) {
        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        boolean hasPassword = user.getPassword() != null && !user.getPassword().isBlank();
        long oauthCount = userOAuthAccountRepo.countByUserId(user.getId());

        if (!hasPassword && oauthCount <= 1) {
            log.warn("Unlink rejected for user {}: cannot disconnect only authentication method", user.getHotdropId());
            throw new IllegalStateException("Cannot disconnect your only login method. Please set a password or link another account first.");
        }

        UserOAuthAccount account = userOAuthAccountRepo.findByUserIdAndProvider(user.getId(), provider)
                .orElseThrow(() -> new ResourceNotFoundException("No linked account found for provider " + provider));

        userOAuthAccountRepo.delete(account);
        log.info("Unlinked provider {} for user {}", provider, user.getHotdropId());
    }

    @Override
    @Transactional(readOnly = true)
    public LinkedAccountsSummaryDto getLinkedAccountsSummary(String hotdropId) {
        User user = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        boolean hasPassword = user.getPassword() != null && !user.getPassword().isBlank();
        List<UserOAuthAccount> accounts = userOAuthAccountRepo.findByUserId(user.getId());

        List<OAuthAccountResponseDto> dtos = accounts.stream()
                .map(a -> OAuthAccountResponseDto.builder()
                        .provider(a.getProvider())
                        .providerUserId(a.getProviderUserId())
                        .email(a.getEmail())
                        .linkedAt(a.getCreatedAt())
                        .build())
                .toList();

        return LinkedAccountsSummaryDto.builder()
                .hasPassword(hasPassword)
                .linkedAccounts(dtos)
                .build();
    }

    private String generateUniqueHotdropId(OAuth2UserInfo userInfo) {
        String candidate = null;
        if (userInfo.getAttributes().containsKey("login")) {
            candidate = String.valueOf(userInfo.getAttributes().get("login")).trim().toLowerCase();
        }

        if (candidate == null || candidate.isBlank()) {
            String email = userInfo.getEmail();
            if (email != null && email.contains("@")) {
                candidate = email.substring(0, email.indexOf('@')).trim().toLowerCase();
            } else if (userInfo.getName() != null && !userInfo.getName().isBlank()) {
                candidate = userInfo.getName().trim().toLowerCase();
            } else {
                candidate = "user";
            }
        }

        candidate = candidate.replaceAll("[^a-z0-9_]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_+", "")
                .replaceAll("_+$", "");

        if (candidate.length() < 3) {
            candidate = "user_" + candidate;
        }
        if (candidate.length() > 20) {
            candidate = candidate.substring(0, 20);
        }

        String base = candidate;
        int counter = 1;
        while (userRepo.existsByHotdropId(candidate)) {
            candidate = base + counter;
            counter++;
        }

        return candidate;
    }

    private String[] parseName(String fullName, String fallback) {
        if (fullName == null || fullName.isBlank()) {
            return new String[]{fallback, ""};
        }
        String trimmed = fullName.trim();
        int spaceIndex = trimmed.indexOf(' ');
        if (spaceIndex == -1) {
            String first = trimmed.length() > 50 ? trimmed.substring(0, 50) : trimmed;
            return new String[]{first, ""};
        }
        String first = trimmed.substring(0, spaceIndex).trim();
        String last = trimmed.substring(spaceIndex + 1).trim();
        if (first.length() > 50) first = first.substring(0, 50);
        if (last.length() > 50) last = last.substring(0, 50);
        return new String[]{first, last};
    }
}
