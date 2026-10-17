package com.arjun.hotdrop_backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.data.redis.url=redis://localhost:6379"
})
class ActuatorCacheMetricsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CacheManager cacheManager;

    @Test
    @DisplayName("Verify /actuator/health returns 200 with UP status")
    void testActuatorHealth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Verify /actuator/metrics exposes cache meters including cache.gets, cache.puts, and cache.removals")
    void testActuatorMetricsList() throws Exception {
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.names", hasItems(
                        "cache.gets",
                        "cache.puts",
                        "cache.removals"
                )));
    }

    @Test
    @DisplayName("Verify /actuator/metrics/cache.gets exposes bounded tags and measurements")
    void testActuatorCacheGetsMetricDetails() throws Exception {
        mockMvc.perform(get("/actuator/metrics/cache.gets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("cache.gets"))
                .andExpect(jsonPath("$.availableTags[*].tag", hasItems("cache", "result")));
    }

    @Test
    @DisplayName("Verify /actuator/prometheus exports cache metrics in Prometheus text format")
    void testActuatorPrometheusFormat() throws Exception {
        // Exercise cache to generate hit, miss, and put counts
        Cache cache = cacheManager.getCache("compiledFeed");
        if (cache != null) {
            cache.get("prometheus-test-key"); // miss
            cache.put("prometheus-test-key", "prometheus-val"); // put
            cache.get("prometheus-test-key"); // hit
            cache.evict("prometheus-test-key"); // removal / delete
        }

        mockMvc.perform(get("/actuator/prometheus").accept(MediaType.TEXT_PLAIN))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("cache_gets_total")))
                .andExpect(content().string(containsString("cache_puts_total")))
                .andExpect(content().string(containsString("cache_removals_total")));
    }
}
