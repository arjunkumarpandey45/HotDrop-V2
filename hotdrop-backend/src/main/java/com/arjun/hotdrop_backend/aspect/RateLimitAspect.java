package com.arjun.hotdrop_backend.aspect;

import com.arjun.hotdrop_backend.annotation.RateLimited;

import com.arjun.hotdrop_backend.error.RateLimitExceededException;
import com.arjun.hotdrop_backend.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimiterService rateLimiterService;

    @Around("@annotation(rateLimited)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimited rateLimited) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        String actionName = joinPoint.getSignature().getName();
        String rateLimitKey = resolveLimitKey(request, actionName);

        int capacity = rateLimited.capacity();
        int refillTokens = rateLimited.refillTokens();
        int durationSeconds = rateLimited.refillDurationSeconds();

        log.info("Checking rate limit for {} (limit: {} per {}s, key: {})",
                actionName, capacity, durationSeconds, rateLimitKey);

        if (!rateLimiterService.tryConsume(rateLimitKey, capacity, refillTokens, durationSeconds)) {
            log.warn("Too many requests for key: {}", rateLimitKey);
            throw new RateLimitExceededException("Rate limit exceeded. Please wait before trying again.");
        }

        return joinPoint.proceed();
    }

    private String resolveLimitKey(HttpServletRequest request, String actionName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String clientIdentifier;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            clientIdentifier = "USER:" + auth.getName();
        } else {
            clientIdentifier = "IP:" + getClientIp(request);
        }

        return actionName + ":" + clientIdentifier;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }

        return request.getRemoteAddr();
    }
}