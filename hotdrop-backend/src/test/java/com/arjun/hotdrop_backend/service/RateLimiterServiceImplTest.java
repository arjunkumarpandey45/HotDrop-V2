package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.service.impl.RateLimiterServiceImpl;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.distributed.proxy.RemoteBucketBuilder;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimiterServiceImplTest {

    @Mock
    private LettuceBasedProxyManager<byte[]> proxyManager;

    @Mock
    private RemoteBucketBuilder<byte[]> bucketBuilder;

    @Mock
    private BucketProxy bucketProxy;

    @InjectMocks
    private RateLimiterServiceImpl rateLimiterService;

    @Nested
    @DisplayName("Configuration Tests")
    class ConfigurationTests {

        @Test
        @DisplayName("getConfiguration should create valid BucketConfiguration with specified parameters")
        void getConfiguration_BuildsValidConfiguration() {
            Supplier<BucketConfiguration> configSupplier = rateLimiterService.getConfiguration(20, 10, 60);

            assertThat(configSupplier).isNotNull();
            BucketConfiguration config = configSupplier.get();
            assertThat(config).isNotNull();
            assertThat(config.getBandwidths()).hasSize(1);
            assertThat(config.getBandwidths()[0].getCapacity()).isEqualTo(20L);
        }
    }

    @Nested
    @DisplayName("tryConsume Tests")
    class TryConsumeTests {

        @Test
        @DisplayName("tryConsume with key should consume with default parameters and return true when allowed")
        void tryConsume_DefaultParameters_Allowed_ReturnsTrue() {
            when(proxyManager.builder()).thenReturn(bucketBuilder);
            when(bucketBuilder.build(any(byte[].class), any(Supplier.class))).thenReturn(bucketProxy);
            when(bucketProxy.tryConsume(1L)).thenReturn(true);

            boolean result = rateLimiterService.tryConsume("user_ip_127.0.0.1");

            assertThat(result).isTrue();
            verify(bucketProxy).tryConsume(1L);
        }

        @Test
        @DisplayName("tryConsume with custom parameters should return false when rate limit breached")
        void tryConsume_CustomParameters_LimitExceeded_ReturnsFalse() {
            when(proxyManager.builder()).thenReturn(bucketBuilder);
            when(bucketBuilder.build(any(byte[].class), any(Supplier.class))).thenReturn(bucketProxy);
            when(bucketProxy.tryConsume(1L)).thenReturn(false);

            boolean result = rateLimiterService.tryConsume("user_ip_127.0.0.1", 5, 5, 30);

            assertThat(result).isFalse();
            verify(bucketProxy).tryConsume(1L);
        }

        @Test
        @DisplayName("tryConsume should fail open and return true when Redis or proxyManager throws exception")
        void tryConsume_ExceptionThrown_FailsOpenReturnsTrue() {
            when(proxyManager.builder()).thenThrow(new RuntimeException("Redis connection timeout"));

            boolean result = rateLimiterService.tryConsume("user_ip_127.0.0.1");

            assertThat(result).isTrue();
        }
    }
}
