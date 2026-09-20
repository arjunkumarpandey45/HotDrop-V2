package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.annotation.RateLimited;
import com.arjun.hotdrop_backend.dto.ApiResponse;
import com.arjun.hotdrop_backend.dto.DeveloperDashboardStatsDto;

import com.arjun.hotdrop_backend.service.impl.DeveloperDashboardServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/developer/dashboard")
@RequiredArgsConstructor
@Tag(name = "Developer Analytics", description = "Endpoints for developer portfolio health and metrics")
public class DeveloperDashboardController {

    private final DeveloperDashboardServiceImpl dashboardService;
    @RateLimited(capacity = 15, refillTokens = 15, refillDurationSeconds = 60)
    @GetMapping("/stats")
    @Operation(summary = "Get current authenticated developer's dashboard metrics")
    public ResponseEntity<ApiResponse<DeveloperDashboardStatsDto>> getMyDashboardStats(
            @AuthenticationPrincipal UserDetails currentUser) {

        DeveloperDashboardStatsDto stats = dashboardService.getUserDashboardStats(currentUser.getUsername());

        return ResponseEntity.ok(ApiResponse.<DeveloperDashboardStatsDto>builder()
                .statusCode(200)
                .message("Dashboard analytics generated successfully")
                .data(stats)
                .build());
    }
}