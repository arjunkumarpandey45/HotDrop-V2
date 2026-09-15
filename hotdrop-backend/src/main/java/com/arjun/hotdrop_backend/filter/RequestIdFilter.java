package com.arjun.hotdrop_backend.filter;

import io.micrometer.common.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String MDC_KEY = "requestId";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().substring(0, 8);
        }

        try {
            MDC.put(MDC_KEY, requestId);
            response.setHeader(REQUEST_ID_HEADER, requestId);
            log.info("Incoming request: {} {} (Request ID: {})", request.getMethod(), request.getRequestURI(), requestId);

            filterChain.doFilter(request, response);

            log.info("Completed request: {} {} (Status: {})", request.getMethod(), request.getRequestURI(), response.getStatus());
        } catch (Exception e) {
            log.error("Request processing failed for {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
            throw e;
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}