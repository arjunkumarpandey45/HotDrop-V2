package com.arjun.hotdrop_backend;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@SpringBootApplication
@EnableScheduling
@EnableCaching
public class HotdropBackendApplication {

	public static void main(String[] args) {
		log.info("Starting the server...");
		SpringApplication.run(HotdropBackendApplication.class, args);
		log.info("Server started successfully.");
	}

}
