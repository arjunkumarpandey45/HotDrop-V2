package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.DeveloperDashboardStatsDto;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.mapper.DeveloperDashboardMapper;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import com.arjun.hotdrop_backend.service.impl.DeveloperDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeveloperDashboardServiceImplTest {

    @Mock
    private PostRepo postRepository;

    @Mock
    private UserRepo userRepository;

    @Mock
    private DeveloperDashboardMapper developerDashboardMapper;

    @InjectMocks
    private DeveloperDashboardServiceImpl developerDashboardService;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(userId)
                .hotdropId("test_dev")
                .build();
    }

    @Test
    @DisplayName("Should successfully calculate dashboard stats when user has posts")
    void getUserDashboardStats_WithPosts_Success() {
        when(userRepository.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));

        PostRepo.PostStatsProjection mockStats = mock(PostRepo.PostStatsProjection.class);
        when(mockStats.getTotalDrops()).thenReturn(10L);
        when(mockStats.getLiveDrops()).thenReturn(8L);
        when(mockStats.getDeadDrops()).thenReturn(2L);
        when(mockStats.getTotalLikes()).thenReturn(45L);
        when(mockStats.getTotalComments()).thenReturn(12L);
        when(postRepository.getStatsByUserId(userId)).thenReturn(mockStats);

        List<Object[]> techRows = new ArrayList<>();
        techRows.add(new Object[]{"React", 6L});
        techRows.add(new Object[]{"Spring Boot", 4L});
        when(postRepository.getTopTechStacksByUserId(userId)).thenReturn(techRows);

        DeveloperDashboardStatsDto mockResultDto = DeveloperDashboardStatsDto.builder().build();
        when(developerDashboardMapper.toStatsDto(
                eq(10L), eq(8L), eq(2L), eq(80.0), eq(45L), eq(12L), anyMap()
        )).thenReturn(mockResultDto);

        DeveloperDashboardStatsDto result = developerDashboardService.getUserDashboardStats("test_dev");

        assertThat(result).isNotNull();
        verify(developerDashboardMapper).toStatsDto(
                eq(10L), eq(8L), eq(2L), eq(80.0), eq(45L), eq(12L), anyMap()
        );
    }

    @Test
    @DisplayName("Should calculate 0.0 health percentage when user has zero drops")
    void getUserDashboardStats_ZeroDrops_HealthPercentageZero() {
        when(userRepository.findByHotdropId("test_dev")).thenReturn(Optional.of(sampleUser));

        PostRepo.PostStatsProjection mockStats = mock(PostRepo.PostStatsProjection.class);
        when(mockStats.getTotalDrops()).thenReturn(0L);
        when(mockStats.getLiveDrops()).thenReturn(0L);
        when(mockStats.getDeadDrops()).thenReturn(0L);
        when(mockStats.getTotalLikes()).thenReturn(0L);
        when(mockStats.getTotalComments()).thenReturn(0L);
        when(postRepository.getStatsByUserId(userId)).thenReturn(mockStats);
        when(postRepository.getTopTechStacksByUserId(userId)).thenReturn(Collections.emptyList());

        DeveloperDashboardStatsDto mockResultDto = DeveloperDashboardStatsDto.builder().build();
        when(developerDashboardMapper.toStatsDto(
                eq(0L), eq(0L), eq(0L), eq(0.0), eq(0L), eq(0L), anyMap()
        )).thenReturn(mockResultDto);

        DeveloperDashboardStatsDto result = developerDashboardService.getUserDashboardStats("test_dev");

        assertThat(result).isNotNull();
        verify(developerDashboardMapper).toStatsDto(
                eq(0L), eq(0L), eq(0L), eq(0.0), eq(0L), eq(0L), anyMap()
        );
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user is not found")
    void getUserDashboardStats_UserNotFound_ThrowsException() {
        when(userRepository.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> developerDashboardService.getUserDashboardStats("unknown_dev"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found: unknown_dev");

        verifyNoInteractions(postRepository);
        verifyNoInteractions(developerDashboardMapper);
    }
}
