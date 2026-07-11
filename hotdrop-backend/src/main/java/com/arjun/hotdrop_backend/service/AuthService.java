package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.LoginRequestDto;
import com.arjun.hotdrop_backend.dto.LoginResponseDto;
import com.arjun.hotdrop_backend.dto.RegisterRequestDto;
import com.arjun.hotdrop_backend.dto.UserResponseDto;
import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.repository.RoleRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.utils.JwtUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;

    public UserResponseDto register(RegisterRequestDto registerRequestDto) {
        if (userRepo.existsByUsername(registerRequestDto.getUsername()) && userRepo.existsByEmail(registerRequestDto.getEmail())) {
            throw new IllegalArgumentException("Please try again in 15 minutes");
        }
        if (userRepo.existsByUsername(registerRequestDto.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepo.existsByEmail(registerRequestDto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        Role userRole = roleRepo.findByRoleName(RoleType.USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));
        User user = userRepo.save(User.builder()
                .username(registerRequestDto.getUsername())
                .password(passwordEncoder.encode(registerRequestDto.getPassword()))
                .email(registerRequestDto.getEmail())
                .authProvider(AuthProvider.LOCAL)
                .roles(Set.of(userRole))
                .firstName(registerRequestDto.getFirstName())
                .lastName(registerRequestDto.getLastName()).build());


        String token = jwtUtils.generateEmailVerificationToken(user.getEmail());
        String verificationLink = "http://localhost:8080/auth/verify-email?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), verificationLink);
        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(
                        user.getRoles()
                                .stream()
                                .map(role -> role.getRoleName().name())
                                .collect(Collectors.toSet())
                )
                .build();
    }


    @Transactional
    public void verifyEmail(String token) {
        if (!jwtUtils.validateEmailToken(token)) {
            throw new IllegalArgumentException("Invalid or expired verification token.");
        }

        String email = jwtUtils.getEmailFromToken(token);
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (user.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified.");
        }

        user.setEmailVerified(true);
        userRepo.save(user);
    }

    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        User user = userRepo.findByUsername(loginRequestDto.getUsernameOrEmail())
                .or(() -> userRepo.findByEmail(loginRequestDto.getUsernameOrEmail()))
                .orElseThrow(() -> new RuntimeException("Email or Username is not valid"));
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email first");
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), loginRequestDto.getPassword()));
        String jwtToken = jwtUtils.generateToken(authentication);
        user.setLoggedIn(true);
        userRepo.save(user);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        return LoginResponseDto.builder().isLoggedIn(true)
                .token(jwtToken)
                .type("Bearer")
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }
}