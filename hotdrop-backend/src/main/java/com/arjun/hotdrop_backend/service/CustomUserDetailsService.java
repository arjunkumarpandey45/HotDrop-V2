package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) {

        var user = userRepo.findByUsername(usernameOrEmail)
                .or(() -> userRepo.findByEmail(usernameOrEmail))
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with username or email: " + usernameOrEmail
                        )
                );

        // Spring Security UserDetails build karo
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername()) // Humesha principal identity unique username rakho
                .password(user.getPassword())
                .authorities(
                        user.getRoles()
                                .stream()
                                .map(role -> "ROLE_" + role.getRoleName().name())
                                .toArray(String[]::new)
                )
                .build();
    }
}