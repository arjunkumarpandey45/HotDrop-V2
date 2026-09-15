package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.DeveloperDashboardStatsDto;

public interface DeveloperDashboardService {
    DeveloperDashboardStatsDto getUserDashboardStats(String hotdropId);
}
