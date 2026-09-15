package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;
@Slf4j
@Service
public class JwtServiceImpl implements JwtService {

    @Value("${SECRET_KEY}")
    private String secretKey;

    @Value("${app.jwt.email-verification-expiration-ms}")
    private long emailTokenExpirationMs;
    @Value("${app.jwt.jwt-expiration-ms}")
    private long jwtExpirationMs;
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.error("Failed to parse claims from token: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public String extractHotdropId(String token) {
        log.info("Extracting user hotdrop ID from token");
        Claims claims = extractAllClaims(token);
        return claims.getSubject();
    }

    public String getEmailFromToken(String token) {
        log.info("Extracting email from verification token");
        Claims claims = extractAllClaims(token);
        return claims.getSubject();
    }

    public String generateEmailVerificationToken(String email) {
        log.info("Generating email verification token for: {}", email);
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "EMAIL_VERIFICATION")
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + emailTokenExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean validateEmailToken(String token) {
        log.info("Validating email verification token");
        try {
            Claims claims = extractAllClaims(token);
            boolean isValid = "EMAIL_VERIFICATION".equals(claims.get("purpose"))
                    && claims.getExpiration().after(new Date());
            if (!isValid) {
                log.error("Email verification token is either expired or wrong purpose");
            }
            return isValid;
        } catch (Exception e) {
            log.error("Email verification token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean validateJwtToken(String authToken) {
        try {
            extractAllClaims(authToken);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT access token: {}", e.getMessage());
            return false;
        }
    }

    public String generateTokenFromHotdropId(String hotdropId) {
        log.info("Generating new JWT token for hotdropId: {}", hotdropId);
        return Jwts.builder()
                .subject(hotdropId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        log.info("Generating JWT access token for user: {}", userPrincipal.getUsername());

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
