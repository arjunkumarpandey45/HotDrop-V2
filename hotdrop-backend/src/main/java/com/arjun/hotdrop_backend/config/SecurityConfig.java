package com.arjun.hotdrop_backend.config;

import com.arjun.hotdrop_backend.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
@Value("${FRONTEND_URL}")
private String frontendURL;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sessionConfig ->
                        sessionConfig.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/public/**",
                                "/auth/**",
                                "/posts/**",
                                "/users/*/get-all-following",
                                "/users/*/get-all-followers",
                                "/users/search/**",
                                "/actuator/**",
                                "/ws/**",
                                "/"
                        ).permitAll()
                        .requestMatchers(
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/posts/feed"
                        ).permitAll()
                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")
                        .anyRequest()
                        .authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(
                                (request, response, authException) -> {
                                    log.error("Authentication required to access [{}]: {}", request.getRequestURI(), authException.getMessage());
                                    response.setStatus(
                                            HttpStatus.UNAUTHORIZED.value()
                                    );
                                    response.setContentType(
                                            "application/json"
                                    );
                                    response.setCharacterEncoding("UTF-8");
                                    response.getWriter().write("""
                                            {
                                                "status": 401,
                                                "error": "Unauthorized",
                                                "message": "Authentication is required to access this resource.",
                                                "path": "%s"
                                            }
                                            """.formatted(
                                            request.getRequestURI()
                                    ));
                                }
                        )
                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {
                                    log.error("Access forbidden for request [{}]: {}", request.getRequestURI(), accessDeniedException.getMessage());
                                    response.setStatus(
                                            HttpStatus.FORBIDDEN.value()
                                    );
                                    response.setContentType(
                                            "application/json"
                                    );
                                    response.setCharacterEncoding("UTF-8");
                                    response.getWriter().write("""
                                            {
                                                "status": 403,
                                                "error": "Forbidden",
                                                "message": "You do not have permission to access this resource.",
                                                "path": "%s"
                                            }
                                            """.formatted(
                                            request.getRequestURI()
                                    ));
                                }
                        )
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendURL)); 
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}