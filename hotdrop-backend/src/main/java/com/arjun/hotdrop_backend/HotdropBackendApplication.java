package com.arjun.hotdrop_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HotdropBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HotdropBackendApplication.class, args);
	}

}
