package com.arjun.hotdrop_backend.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.codec.StringCodec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.time.Duration;

@Configuration
public class Bucket4jRedisConfig {

    @Bean
    public LettuceBasedProxyManager<byte[]> proxyManager(LettuceConnectionFactory connectionFactory) {
        RedisClient redisClient = (RedisClient) connectionFactory.getNativeClient();

        assert redisClient != null;
        return LettuceBasedProxyManager.builderFor(redisClient)
                .withExpirationStrategy(
                        ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofMinutes(5))
                )
                .build();
    }
}