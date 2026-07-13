package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.LinkVerificationRequestDto;
import com.arjun.hotdrop_backend.dto.LinkVerificationResponseDto;
import com.arjun.hotdrop_backend.scheduler.LinkTrackingScheduler;
import com.arjun.hotdrop_backend.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final LinkTrackingScheduler linkTrackingScheduler; // 1. Inject the background engine

    @PostMapping("/verify-link")
    public ResponseEntity<LinkVerificationResponseDto> verifyLink(
            @Valid @RequestBody LinkVerificationRequestDto requestDto) {
        LinkVerificationResponseDto response = postService.verifyProjectLink(requestDto.getUrl());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-tracker")
    public ResponseEntity<String> triggerTrackerManual() {
        // Run async or direct sync for test logs
        linkTrackingScheduler.startLiveTracking();
        return ResponseEntity.ok("Tracking engine triggered successfully! Check your console logs. 🚀");
    }
}