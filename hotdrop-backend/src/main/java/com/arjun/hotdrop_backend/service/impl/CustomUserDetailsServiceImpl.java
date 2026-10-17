package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.CustomUserDetailsService;
import com.arjun.hotdrop_backend.utils.MaskUtils;
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
        log.info("Loading user details for: {}", MaskUtils.maskIdentifier(hotdropIdOrEmail));

        User user = userRepo.findByHotdropId(hotdropIdOrEmail)
                .or(() -> userRepo.findByEmail(hotdropIdOrEmail))
                .orElseThrow(() -> {
                    log.warn("User not found with username or email: {}", MaskUtils.maskIdentifier(hotdropIdOrEmail));
                    return new UsernameNotFoundException(
                            "User not found with hotdrop Id or email: " + hotdropIdOrEmail
                    );
                });

        log.info("Loaded user details for: {}", user.getHotdropId());

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getHotdropId())
                .password(user.getPassword() != null ? user.getPassword() : "")
                .authorities(
                        user.getRoles()
                                .stream()
                                .map(role -> "ROLE_" + role.getRoleName().name())
                                .toArray(String[]::new)
                )
                .build();
    }
}
