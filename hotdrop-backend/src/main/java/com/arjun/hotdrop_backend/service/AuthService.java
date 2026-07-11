package com.arjun.hotdrop_backend.service;

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
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

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

    @GetMapping("/verify-email")
    @Transactional
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {

        if (!jwtUtils.validateEmailToken(token)) {
            return ResponseEntity.badRequest().body("Invalid or expired verification token.");
        }


        String email = jwtUtils.getEmailFromToken(token);
        var userOptional = userRepo.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found.");
        }

        var user = userOptional.get();
        if (user.isEmailVerified()) {
            return ResponseEntity.ok("Email is already verified.");
        }


        user.setEmailVerified(true);
        userRepo.save(user);

        return ResponseEntity.ok("Account verified successfully! You can now log in.");
    }
}