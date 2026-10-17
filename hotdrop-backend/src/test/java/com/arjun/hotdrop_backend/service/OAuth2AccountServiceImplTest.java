package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.AuthResultDto;
import com.arjun.hotdrop_backend.dto.LinkedAccountsSummaryDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
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
import com.arjun.hotdrop_backend.security.oauth2.OAuthFlowStatus;
import com.arjun.hotdrop_backend.security.oauth2.OAuthLinkData;
import com.arjun.hotdrop_backend.security.oauth2.user.GoogleOAuth2UserInfo;
import com.arjun.hotdrop_backend.security.oauth2.user.OAuth2UserInfo;
import com.arjun.hotdrop_backend.service.impl.OAuth2AccountServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AccountServiceImplTest {

    @Mock
    private UserOAuthAccountRepo userOAuthAccountRepo;
    @Mock
    private UserRepo userRepo;
    @Mock
    private RoleRepo roleRepo;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AuthMapper authMapper;
    @Mock
    private RedisTemplate<String, String> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private ObjectMapper objectMapper;
    private OAuth2AccountServiceImpl oAuth2AccountService;

    private User sampleUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        oAuth2AccountService = new OAuth2AccountServiceImpl(
                userOAuthAccountRepo,
                userRepo,
                roleRepo,
                passwordEncoder,
                jwtService,
                refreshTokenService,
                authMapper,
                redisTemplate,
                objectMapper
        );

        userRole = Role.builder().id(UUID.randomUUID()).roleName(RoleType.USER).build();
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("johndoe")
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .password("$2a$10$hashedpassword")
                .emailVerified(true)
                .banned(false)
                .roles(Set.of(userRole))
                .build();
    }

    @Test
    @DisplayName("Case A: Should authenticate existing linked OAuth user")
    void shouldAuthenticateExistingLinkedUser() {
        OAuth2UserInfo userInfo = new GoogleOAuth2UserInfo(Map.of(
                "sub", "google-123",
                "email", "john@example.com",
                "name", "John Doe"
        ));

        UserOAuthAccount account = UserOAuthAccount.builder()
                .user(sampleUser)
                .provider(AuthProvider.GOOGLE)
                .providerUserId("google-123")
                .build();

        when(userOAuthAccountRepo.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-123"))
                .thenReturn(Optional.of(account));

        CustomOAuth2User result = oAuth2AccountService.processOAuth2User(userInfo, AuthProvider.GOOGLE);

        assertThat(result.getFlowStatus()).isEqualTo(OAuthFlowStatus.AUTHENTICATED);
        assertThat(result.getUser()).isEqualTo(sampleUser);
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("Case A: Should throw exception if existing linked user is banned")
    void shouldThrowExceptionWhenLinkedUserIsBanned() {
        sampleUser.setBanned(true);
        OAuth2UserInfo userInfo = new GoogleOAuth2UserInfo(Map.of(
                "sub", "google-123",
                "email", "john@example.com"
        ));
        UserOAuthAccount account = UserOAuthAccount.builder()
                .user(sampleUser)
                .provider(AuthProvider.GOOGLE)
                .providerUserId("google-123")
                .build();

        when(userOAuthAccountRepo.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-123"))
                .thenReturn(Optional.of(account));

        assertThatThrownBy(() -> oAuth2AccountService.processOAuth2User(userInfo, AuthProvider.GOOGLE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("banned");
    }

    @Test
    @DisplayName("Case B: Should require linking when email matches existing HotDrop account")
    void shouldRequireLinkingWhenEmailMatchesExistingAccount() {
        OAuth2UserInfo userInfo = new GoogleOAuth2UserInfo(Map.of(
                "sub", "google-456",
                "email", "john@example.com",
                "name", "John Doe"
        ));

        when(userOAuthAccountRepo.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-456"))
                .thenReturn(Optional.empty());
        when(userRepo.findByEmail("john@example.com"))
                .thenReturn(Optional.of(sampleUser));

        CustomOAuth2User result = oAuth2AccountService.processOAuth2User(userInfo, AuthProvider.GOOGLE);

        assertThat(result.getFlowStatus()).isEqualTo(OAuthFlowStatus.LINK_REQUIRED);
        assertThat(result.getUser()).isEqualTo(sampleUser);
        verify(userOAuthAccountRepo, never()).save(any());
    }

    @Test
    @DisplayName("Case C: Should auto-provision new user and create OAuth link")
    void shouldAutoProvisionNewUser() {
        OAuth2UserInfo userInfo = new GoogleOAuth2UserInfo(Map.of(
                "sub", "google-999",
                "email", "newuser@example.com",
                "name", "Alice Wonder",
                "picture", "https://example.com/avatar.png"
        ));

        when(userOAuthAccountRepo.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-999"))
                .thenReturn(Optional.empty());
        when(userRepo.findByEmail("newuser@example.com"))
                .thenReturn(Optional.empty());
        when(roleRepo.findByRoleName(RoleType.USER))
                .thenReturn(Optional.of(userRole));
        when(userRepo.existsByHotdropId(anyString()))
                .thenReturn(false);

        when(userRepo.save(any(User.class)))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    u.setId(UUID.randomUUID());
                    return u;
                });

        CustomOAuth2User result = oAuth2AccountService.processOAuth2User(userInfo, AuthProvider.GOOGLE);

        assertThat(result.getFlowStatus()).isEqualTo(OAuthFlowStatus.AUTHENTICATED);
        assertThat(result.getUser().getEmail()).isEqualTo("newuser@example.com");
        assertThat(result.getUser().isEmailVerified()).isTrue();
        assertThat(result.getUser().getPassword()).isNull();
        assertThat(result.getUser().getFirstName()).isEqualTo("Alice");
        assertThat(result.getUser().getLastName()).isEqualTo("Wonder");

        verify(userOAuthAccountRepo).save(any(UserOAuthAccount.class));
    }

    @Test
    @DisplayName("Case C: Should resolve username collisions iteratively")
    void shouldResolveUsernameCollision() {
        OAuth2UserInfo userInfo = new GoogleOAuth2UserInfo(Map.of(
                "sub", "google-999",
                "email", "collide@example.com",
                "name", "Collide User"
        ));

        when(userOAuthAccountRepo.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-999"))
                .thenReturn(Optional.empty());
        when(userRepo.findByEmail("collide@example.com"))
                .thenReturn(Optional.empty());
        when(roleRepo.findByRoleName(RoleType.USER))
                .thenReturn(Optional.of(userRole));

        // First candidate exists, second doesn't
        when(userRepo.existsByHotdropId("collide")).thenReturn(true);
        when(userRepo.existsByHotdropId("collide1")).thenReturn(false);

        when(userRepo.save(any(User.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2User result = oAuth2AccountService.processOAuth2User(userInfo, AuthProvider.GOOGLE);

        assertThat(result.getUser().getHotdropId()).isEqualTo("collide1");
    }

    @Test
    @DisplayName("Should successfully exchange one-time code for tokens")
    void shouldExchangeCodeSuccessfully() {
        String code = "valid-code-123";
        String key = "oauth2:code:" + code;

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete(key)).thenReturn(sampleUser.getId().toString());
        when(userRepo.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateTokenFromHotdropId(sampleUser.getHotdropId())).thenReturn("access-token-xyz");

        RefreshToken rt = RefreshToken.builder().token("refresh-token-xyz").user(sampleUser).build();
        when(refreshTokenService.createRefreshToken(sampleUser.getHotdropId())).thenReturn(rt);

        LoginResponseDto loginDto = new LoginResponseDto();
        loginDto.setHotdropId(sampleUser.getHotdropId());
        when(authMapper.toLoginResponseDto(eq(sampleUser.getHotdropId()), eq(sampleUser.getEmail()), anyList()))
                .thenReturn(loginDto);
        when(authMapper.toAuthResultDto("access-token-xyz", "refresh-token-xyz", loginDto))
                .thenReturn(new AuthResultDto("access-token-xyz", "refresh-token-xyz", loginDto));

        AuthResultDto result = oAuth2AccountService.exchangeCode(code);

        assertThat(result.getAccessToken()).isEqualTo("access-token-xyz");
        assertThat(result.getRefreshToken()).isEqualTo("refresh-token-xyz");
        verify(valueOperations).getAndDelete(key);
        verify(userRepo).save(sampleUser);
    }

    @Test
    @DisplayName("Should throw exception for expired or invalid exchange code")
    void shouldThrowExceptionForInvalidCode() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete("oauth2:code:invalid")).thenReturn(null);

        assertThatThrownBy(() -> oAuth2AccountService.exchangeCode("invalid"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired");
    }

    @Test
    @DisplayName("Should successfully link provider when password matches")
    void shouldLinkAccountWhenPasswordMatches() throws Exception {
        String token = "link-token-123";
        String key = "oauth2:link:" + token;

        OAuthLinkData linkData = OAuthLinkData.builder()
                .userId(sampleUser.getId())
                .provider(AuthProvider.GITHUB)
                .providerUserId("github-888")
                .email(sampleUser.getEmail())
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete(key)).thenReturn(objectMapper.writeValueAsString(linkData));
        when(userRepo.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("secret123", sampleUser.getPassword())).thenReturn(true);
        when(userOAuthAccountRepo.existsByProviderAndProviderUserId(AuthProvider.GITHUB, "github-888"))
                .thenReturn(false);

        when(jwtService.generateTokenFromHotdropId(sampleUser.getHotdropId())).thenReturn("access-token-123");
        RefreshToken rt = RefreshToken.builder().token("refresh-token-123").user(sampleUser).build();
        when(refreshTokenService.createRefreshToken(sampleUser.getHotdropId())).thenReturn(rt);

        LoginResponseDto loginDto = new LoginResponseDto();
        loginDto.setHotdropId(sampleUser.getHotdropId());
        when(authMapper.toLoginResponseDto(anyString(), anyString(), anyList())).thenReturn(loginDto);
        when(authMapper.toAuthResultDto(anyString(), anyString(), any())).thenReturn(
                new AuthResultDto("access-token-123", "refresh-token-123", loginDto)
        );

        AuthResultDto result = oAuth2AccountService.linkAccountWithPassword(token, "secret123");

        assertThat(result).isNotNull();
        verify(valueOperations).getAndDelete(key);
        verify(userOAuthAccountRepo).save(any(UserOAuthAccount.class));
    }

    @Test
    @DisplayName("Should reject linking when password does not match")
    void shouldRejectLinkingWithBadPassword() throws Exception {
        String token = "link-token-123";
        String key = "oauth2:link:" + token;

        OAuthLinkData linkData = OAuthLinkData.builder()
                .userId(sampleUser.getId())
                .provider(AuthProvider.GITHUB)
                .providerUserId("github-888")
                .email(sampleUser.getEmail())
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete(key)).thenReturn(objectMapper.writeValueAsString(linkData));
        when(userRepo.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpass", sampleUser.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> oAuth2AccountService.linkAccountWithPassword(token, "wrongpass"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid password");

        verify(userOAuthAccountRepo, never()).save(any());
    }

    @Test
    @DisplayName("Should reject password linking if existing account has no password set")
    void shouldRejectLinkingIfUserHasNoPassword() throws Exception {
        sampleUser.setPassword(null);
        String token = "link-token-123";
        String key = "oauth2:link:" + token;

        OAuthLinkData linkData = OAuthLinkData.builder()
                .userId(sampleUser.getId())
                .provider(AuthProvider.GITHUB)
                .providerUserId("github-888")
                .email(sampleUser.getEmail())
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete(key)).thenReturn(objectMapper.writeValueAsString(linkData));
        when(userRepo.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> oAuth2AccountService.linkAccountWithPassword(token, "anyPass"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("does not have a password set");
    }

    @Test
    @DisplayName("Should reject linking replay or expired token")
    void shouldRejectLinkingWhenTokenIsExpiredOrAlreadyUsed() {
        String token = "used-or-expired-token";
        String key = "oauth2:link:" + token;

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete(key)).thenReturn(null);

        assertThatThrownBy(() -> oAuth2AccountService.linkAccountWithPassword(token, "anyPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired linking token");
    }

    @Test
    @DisplayName("Should allow unlinking when user has a password set")
    void shouldUnlinkWhenUserHasPassword() {
        UserOAuthAccount account = UserOAuthAccount.builder()
                .user(sampleUser)
                .provider(AuthProvider.GOOGLE)
                .providerUserId("google-123")
                .build();

        when(userRepo.findByHotdropId(sampleUser.getHotdropId())).thenReturn(Optional.of(sampleUser));
        when(userOAuthAccountRepo.countByUserId(sampleUser.getId())).thenReturn(1L);
        when(userOAuthAccountRepo.findByUserIdAndProvider(sampleUser.getId(), AuthProvider.GOOGLE))
                .thenReturn(Optional.of(account));

        oAuth2AccountService.unlinkAccount(sampleUser.getHotdropId(), AuthProvider.GOOGLE);

        verify(userOAuthAccountRepo).delete(account);
    }

    @Test
    @DisplayName("Should reject unlinking sole authentication method when user has no password")
    void shouldRejectUnlinkingSoleMethodWithoutPassword() {
        sampleUser.setPassword(null);

        when(userRepo.findByHotdropId(sampleUser.getHotdropId())).thenReturn(Optional.of(sampleUser));
        when(userOAuthAccountRepo.countByUserId(sampleUser.getId())).thenReturn(1L);

        assertThatThrownBy(() -> oAuth2AccountService.unlinkAccount(sampleUser.getHotdropId(), AuthProvider.GOOGLE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot disconnect your only login method");

        verify(userOAuthAccountRepo, never()).delete(any());
    }

    @Test
    @DisplayName("Should return linked accounts summary correctly")
    void shouldReturnLinkedAccountsSummary() {
        UserOAuthAccount account = UserOAuthAccount.builder()
                .user(sampleUser)
                .provider(AuthProvider.GOOGLE)
                .providerUserId("google-123")
                .email("john@gmail.com")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepo.findByHotdropId(sampleUser.getHotdropId())).thenReturn(Optional.of(sampleUser));
        when(userOAuthAccountRepo.findByUserId(sampleUser.getId())).thenReturn(List.of(account));

        LinkedAccountsSummaryDto summary = oAuth2AccountService.getLinkedAccountsSummary(sampleUser.getHotdropId());

        assertThat(summary.isHasPassword()).isTrue();
        assertThat(summary.getLinkedAccounts()).hasSize(1);
        assertThat(summary.getLinkedAccounts().get(0).getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(summary.getLinkedAccounts().get(0).getEmail()).isEqualTo("john@gmail.com");
    }
}
