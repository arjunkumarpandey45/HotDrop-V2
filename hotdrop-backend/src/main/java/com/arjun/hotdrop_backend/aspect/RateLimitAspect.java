package com.arjun.hotdrop_backend.aspect;

import com.arjun.hotdrop_backend.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimiterService rateLimiterService;

    @Around("@annotation(com.arjun.hotdrop_backend.annotation.RateLimited)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        String rateLimitKey = resolveLimitKey(request);
        log.info("Checking rate limit for: {} (client: {})", joinPoint.getSignature().toShortString(), rateLimitKey);

        if (!rateLimiterService.tryConsume(rateLimitKey)) {
            log.error("Rate limit exceeded for: {} (client: {})", joinPoint.getSignature().toShortString(), rateLimitKey);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "status", 429,
                            "error", "Too Many Requests",
                            "message", "Rate limit exceeded. Please wait before trying again."
                    ));
        }

        log.info("Rate limit check passed for: {} (client: {})", joinPoint.getSignature().toShortString(), rateLimitKey);
        return joinPoint.proceed();
    }

    private String resolveLimitKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return "USER:" + auth.getName();
        }

        return "IP:" + getClientIp(request);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}