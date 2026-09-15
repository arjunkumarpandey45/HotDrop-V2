package com.arjun.hotdrop_backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class DeveloperDashboardStatsDto {
    private long totalDrops;
    private long liveDrops;
    private long deadDrops;
    private double healthScorePercentage;
    private long totalLikesReceived;
    private long totalCommentReceived;
    private Map<String, Long> topTechnologies;
}