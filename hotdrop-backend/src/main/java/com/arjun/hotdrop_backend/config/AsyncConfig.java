package com.arjun.hotdrop_backend.config;



import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "linkVerificationTaskExecutor")
    public Executor linkVerificationTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);          // Minimum active worker threads
        executor.setMaxPoolSize(10);          // Peak load par max threads
        executor.setQueueCapacity(50);        // Tasks pending in queue
        executor.setThreadNamePrefix("LinkWorker-");
        executor.initialize();
        return executor;
    }
}