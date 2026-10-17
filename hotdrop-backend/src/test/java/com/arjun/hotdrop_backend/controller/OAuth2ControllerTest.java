package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.AuthResultDto;
import com.arjun.hotdrop_backend.dto.LinkedAccountsSummaryDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.OAuthAccountResponseDto;
import com.arjun.hotdrop_backend.dto.OAuthExchangeRequestDto;
import com.arjun.hotdrop_backend.dto.OAuthLinkRequestDto;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.service.OAuth2AccountService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OAuth2ControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OAuth2AccountService oAuth2AccountService;

    @InjectMocks
    private OAuth2Controller oAuth2Controller;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(oAuth2Controller)
                .setCustomArgumentResolvers(new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /auth/oauth2/exchange should return 200, set HttpOnly cookies, and return body")
    void testExchangeCodeSuccess() throws Exception {
        OAuthExchangeRequestDto requestDto = new OAuthExchangeRequestDto("test-code-123");

        LoginResponseDto loginDto = new LoginResponseDto();
        loginDto.setHotdropId("johndoe");
        loginDto.setEmail("john@example.com");

        AuthResultDto authResult = new AuthResultDto("jwt-access-token", "jwt-refresh-token", loginDto);

        when(oAuth2AccountService.exchangeCode("test-code-123")).thenReturn(authResult);

        mockMvc.perform(post("/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(cookie().value("accessToken", "jwt-access-token"))
                .andExpect(cookie().httpOnly("accessToken", true))
                .andExpect(cookie().value("refreshToken", "jwt-refresh-token"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(jsonPath("$.hotdropId").value("johndoe"))
                .andExpect(jsonPath("$.email").value("john@example.com"));

        verify(oAuth2AccountService).exchangeCode("test-code-123");
    }

    @Test
    @DisplayName("POST /auth/oauth2/exchange via HTTPS should set secure cookies")
    void testExchangeCodeHttpsSetsSecureCookies() throws Exception {
        OAuthExchangeRequestDto requestDto = new OAuthExchangeRequestDto("test-code-https");

        LoginResponseDto loginDto = new LoginResponseDto();
        loginDto.setHotdropId("johndoe");
        loginDto.setEmail("john@example.com");

        AuthResultDto authResult = new AuthResultDto("jwt-access-token", "jwt-refresh-token", loginDto);

        when(oAuth2AccountService.exchangeCode("test-code-https")).thenReturn(authResult);

        mockMvc.perform(post("/auth/oauth2/exchange")
                        .secure(true)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(cookie().secure("accessToken", true))
                .andExpect(cookie().secure("refreshToken", true))
                .andExpect(cookie().httpOnly("accessToken", true))
                .andExpect(cookie().httpOnly("refreshToken", true));
    }

    @Test
    @DisplayName("POST /auth/oauth2/link should link account, set cookies, and return 200")
    void testLinkAccountWithPasswordSuccess() throws Exception {
        OAuthLinkRequestDto requestDto = new OAuthLinkRequestDto("token-abc", "mypassword");

        LoginResponseDto loginDto = new LoginResponseDto();
        loginDto.setHotdropId("johndoe");
        loginDto.setEmail("john@example.com");

        AuthResultDto authResult = new AuthResultDto("jwt-access", "jwt-refresh", loginDto);

        when(oAuth2AccountService.linkAccountWithPassword("token-abc", "mypassword")).thenReturn(authResult);

        mockMvc.perform(post("/auth/oauth2/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(cookie().value("accessToken", "jwt-access"))
                .andExpect(cookie().value("refreshToken", "jwt-refresh"))
                .andExpect(jsonPath("$.hotdropId").value("johndoe"));

        verify(oAuth2AccountService).linkAccountWithPassword("token-abc", "mypassword");
    }

    @Test
    @DisplayName("GET /users/oauth2/accounts should return 200 with linked accounts summary")
    void testGetLinkedAccountsSuccess() throws Exception {
        UserDetails userDetails = User.withUsername("johndoe").password("").roles("USER").build();
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

        OAuthAccountResponseDto accountDto = OAuthAccountResponseDto.builder()
                .provider(AuthProvider.GOOGLE)
                .providerUserId("g-123")
                .email("john@gmail.com")
                .linkedAt(LocalDateTime.now())
                .build();

        LinkedAccountsSummaryDto summary = LinkedAccountsSummaryDto.builder()
                .hasPassword(true)
                .linkedAccounts(List.of(accountDto))
                .build();

        when(oAuth2AccountService.getLinkedAccountsSummary("johndoe")).thenReturn(summary);
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(get("/users/oauth2/accounts")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPassword").value(true))
                .andExpect(jsonPath("$.linkedAccounts[0].provider").value("GOOGLE"))
                .andExpect(jsonPath("$.linkedAccounts[0].email").value("john@gmail.com"));
    }

    @Test
    @DisplayName("DELETE /users/oauth2/unlink/{provider} should unlink provider and return 200")
    void testUnlinkProviderSuccess() throws Exception {
        UserDetails userDetails = User.withUsername("johndoe").password("").roles("USER").build();
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(delete("/users/oauth2/unlink/google")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Successfully disconnected GOOGLE")));

        verify(oAuth2AccountService).unlinkAccount("johndoe", AuthProvider.GOOGLE);
    }

    @Test
    @DisplayName("DELETE /users/oauth2/unlink/{provider} with invalid provider should return 400")
    void testUnlinkInvalidProvider() throws Exception {
        UserDetails userDetails = User.withUsername("johndoe").password("").roles("USER").build();
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(delete("/users/oauth2/unlink/invalid_provider")
                        .principal(auth))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid authentication provider")));
    }
}
