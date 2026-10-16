package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.impl.CustomUserDetailsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceImplTest {

    @Mock
    private UserRepo userRepo;

    @InjectMocks
    private CustomUserDetailsServiceImpl customUserDetailsService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        Role roleUser = Role.builder().id(UUID.randomUUID()).roleName(RoleType.USER).build();
        Role roleAdmin = Role.builder().id(UUID.randomUUID()).roleName(RoleType.ADMIN).build();

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("test_dev")
                .email("test@hotdrop.io")
                .password("encoded_pass")
                .roles(Set.of(roleUser, roleAdmin))
                .build();
    }

    @Test
    @DisplayName("Should successfully load user details by hotdropId")
    void loadUserByUsername_ByHotdropId_Success() {
        when(userRepo.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("test_dev");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("test_dev");
        assertThat(userDetails.getPassword()).isEqualTo("encoded_pass");
        assertThat(userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    @DisplayName("Should successfully load user details by email when hotdropId lookup misses")
    void loadUserByUsername_ByEmail_Success() {
        when(userRepo.findByHotdropId("test@hotdrop.io")).thenReturn(Optional.empty());
        when(userRepo.findByEmail("test@hotdrop.io")).thenReturn(Optional.of(sampleUser));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("test@hotdrop.io");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("test_dev");
        assertThat(userDetails.getPassword()).isEqualTo("encoded_pass");
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user cannot be found by hotdropId or email")
    void loadUserByUsername_UserNotFound_ThrowsException() {
        when(userRepo.findByHotdropId("non_existent")).thenReturn(Optional.empty());
        when(userRepo.findByEmail("non_existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("non_existent"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found with hotdrop Id or email: non_existent");
    }
}
