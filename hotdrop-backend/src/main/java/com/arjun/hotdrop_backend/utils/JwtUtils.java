package com.arjun.hotdrop_backend.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;


@Component
public class JwtUtils {
    @Value("${SECRET_KEY}")
    private String jwtSecret;
    @Value("${app.jwt.email-verification-expiration-ms:900000}") //
    private long emailTokenExpirationMs;

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
}
