package com.arjun.hotdrop_backend.service;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.function.Function;

public interface JwtService {
    String extractHotdropId(String token);
    String getEmailFromToken(String token);
    boolean validateEmailToken(String token);
    String generateToken(Authentication authentication);
    boolean validateJwtToken(String authToken);
    String generateTokenFromHotdropId(String hotdropId);
    String generateEmailVerificationToken(String email);
    long getRemainingExpirationTime(String token);
}