package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsServiceImpl implements CustomUserDetailsService {

    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String hotdropIdOrEmail) {

        User user = userRepo.findByHotdropId(hotdropIdOrEmail)
                .or(() -> userRepo.findByEmail(hotdropIdOrEmail))
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with hotdrop Id or email: " + hotdropIdOrEmail
                        )
                );

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
