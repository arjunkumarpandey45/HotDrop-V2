package com.arjun.hotdrop_backend.service.impl;


import com.arjun.hotdrop_backend.dto.DeveloperDashboardStatsDto;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.DeveloperDashboardService;
import com.arjun.hotdrop_backend.utils.MaskUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeveloperDashboardServiceImpl implements DeveloperDashboardService {

    private final PostRepo postRepository;
    private final UserRepo userRepository;

    @Transactional(readOnly = true)
    public DeveloperDashboardStatsDto getUserDashboardStats(String hotdropId) {
        log.info("Calculating dashboard stats for user: {}", MaskUtils.maskIdentifier(hotdropId));

        UUID userId = userRepository.findByHotdropId(hotdropId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + hotdropId))
                .getId();

        PostRepo.PostStatsProjection stats = postRepository.getStatsByUserId(userId);

        long total = stats.getTotalDrops();
        long live = stats.getLiveDrops();
        long dead = stats.getDeadDrops();
        long totalLikes = stats.getTotalLikes();
        long totalComments=stats.getTotalComments();

        double healthPercentage = total > 0
                ? Math.round(((double) live / total) * 1000.0) / 10.0
                : 0.0;


        List<Object[]> techRows = postRepository.getTopTechStacksByUserId(userId);
        Map<String, Long> topTech = new LinkedHashMap<>();
        for (Object[] row : techRows) {
            String techName = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            topTech.put(techName, count);
        }

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