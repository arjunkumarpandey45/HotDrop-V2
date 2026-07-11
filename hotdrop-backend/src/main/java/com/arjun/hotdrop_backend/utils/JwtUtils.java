package com.arjun.hotdrop_backend.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;


@Slf4j
@Component
public class JwtUtils {
    @Value("${SECRET_KEY}")
    private String jwtSecret;
    @Value("${app.jwt.email-verification-expiration-ms}")
    private long emailTokenExpirationMs;
    @Value("${app.jwt.jwt-expiration-ms}")
    private long jwtExpirationMs;

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateEmailVerificationToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "EMAIL_VERIFICATION")
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + emailTokenExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSignInKey())
                .build().parseSignedClaims(token).getPayload()
                .getSubject();
    }
   public boolean validateEmailToken(String token){
        try {
            var claims= Jwts.parser()
                    .verifyWith((javax.crypto.SecretKey) getSignInKey())
                    .build().parseSignedClaims(token).getPayload();
            return "EMAIL_VERIFICATION".equals(claims.get("purpose")) &&
                    claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return  false;
        }
   }
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSignInKey())
                .compact();
    }
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith((javax.crypto.SecretKey) getSignInKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT Token: {}", e.getMessage());

            return false;
        }
    }
  

    public String generateTokenFromUsername(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(io.jsonwebtoken.SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }
}
