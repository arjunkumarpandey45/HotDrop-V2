package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.DeveloperDashboardStatsDto;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class DeveloperDashboardMapper {

    public DeveloperDashboardStatsDto toStatsDto(long total, long live, long dead, double healthPercentage, long totalLikes, long totalComments, Map<String, Long> topTech) {
        return DeveloperDashboardStatsDto.builder()
                .totalDrops(total)
                .liveDrops(live)
                .deadDrops(dead)
                .healthScorePercentage(healthPercentage)
                .totalLikesReceived(totalLikes)
                .totalCommentReceived(totalComments)
                .topTechnologies(topTech)
                .build();
    }
}
