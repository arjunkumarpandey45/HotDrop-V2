package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.entity.User; 
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