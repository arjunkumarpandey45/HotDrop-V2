package com.arjun.hotdrop_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
		"spring.data.redis.url=redis://localhost:6379"
})
class HotdropBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
