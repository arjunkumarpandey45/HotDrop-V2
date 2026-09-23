package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
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
    private static final String CLAIM_PURPOSE = "purpose";
    private static final String PURPOSE_ACCESS = "ACCESS_TOKEN";
    private static final String PURPOSE_VERIFICATION = "EMAIL_VERIFICATION";
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
            log.error("Could not read token: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public String extractHotdropId(String token) {
        log.info("Getting username from token.");
        Claims claims = extractAllClaims(token);
        if (!PURPOSE_ACCESS.equals(claims.get(CLAIM_PURPOSE))) {
            throw new JwtException("Token is not a valid access token");
        }
        return claims.getSubject();
    }

    public String getEmailFromToken(String token) {
        log.info("Getting email from token.");
        Claims claims = extractAllClaims(token);
        if (!PURPOSE_VERIFICATION.equals(claims.get(CLAIM_PURPOSE))) {
            throw new JwtException("Token is not an email verification token");
        }
        return claims.getSubject();
    }

    public String generateEmailVerificationToken(String email) {
        log.info("Creating verification token for: {}", email);
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "EMAIL_VERIFICATION")
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + emailTokenExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean validateEmailToken(String token) {
        log.info("Checking verification token.");
        try {
            Claims claims = extractAllClaims(token);
            boolean isValid = PURPOSE_VERIFICATION.equals(claims.get(CLAIM_PURPOSE))
                    && claims.getExpiration().after(new Date());
            if (!isValid) {
                log.error("Verification token is expired or invalid.");
            }
            return isValid;
        } catch (Exception e) {
            log.error("Failed to verify token: {}", e.getMessage());
            return false;
        }
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Claims claims = extractAllClaims(authToken);
            return PURPOSE_ACCESS.equals(claims.get(CLAIM_PURPOSE))
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid access token: {}", e.getMessage());
            return false;
        }
    }

    public String generateTokenFromHotdropId(String hotdropId) {
        log.info("Creating token for user: {}", hotdropId);
        return Jwts.builder()
                .subject(hotdropId)
                .claim(CLAIM_PURPOSE, PURPOSE_ACCESS)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    @Override
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return generateTokenFromHotdropId(userPrincipal.getUsername());
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    @Override
    public long getRemainingExpirationTime(String token) {
        log.info("Checking how long the token is valid for.");
        try {

            Claims claims = extractAllClaims(token);
            long diff = claims.getExpiration().getTime() - System.currentTimeMillis();
            return Math.max(0, diff);
        } catch (Exception e) {
            log.warn("Token has already expired: {}", e.getMessage());
            return 0;
        }
    }
}
