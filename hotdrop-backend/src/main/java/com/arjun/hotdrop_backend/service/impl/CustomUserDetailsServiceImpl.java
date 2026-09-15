package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsServiceImpl implements CustomUserDetailsService {

    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String hotdropIdOrEmail) {
        log.info("Loading user details for authentication: {}", hotdropIdOrEmail);

        User user = userRepo.findByHotdropId(hotdropIdOrEmail)
                .or(() -> userRepo.findByEmail(hotdropIdOrEmail))
                .orElseThrow(() -> {
                    log.error("Authentication failed: user not found with username or email: {}", hotdropIdOrEmail);
                    return new UsernameNotFoundException(
                            "User not found with hotdrop Id or email: " + hotdropIdOrEmail
                    );
                });

        log.info("User details loaded successfully for user: {}", user.getHotdropId());

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getHotdropId())
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
