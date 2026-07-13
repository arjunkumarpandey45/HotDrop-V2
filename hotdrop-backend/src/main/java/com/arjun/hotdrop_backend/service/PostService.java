package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.LinkVerificationResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final List<String> userAgents;
    private final Random random;


    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public LinkVerificationResponseDto verifyProjectLink(String inputUrl) {
        if (inputUrl == null || inputUrl.isBlank()) {
            return LinkVerificationResponseDto.builder()
                    .isLive(false)
                    .url(inputUrl)
                    .message("URL cannot be empty!")
                    .build();
        }

        String cleanUrl = inputUrl.trim();
        if (!cleanUrl.toLowerCase().startsWith("http://") && !cleanUrl.toLowerCase().startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }

        String randomUA = userAgents.get(random.nextInt(userAgents.size()));


        try {
            HttpRequest headRequest = HttpRequest.newBuilder()
                    .uri(URI.create(cleanUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("User-Agent", randomUA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Cache-Control", "no-cache")
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<Void> headResponse = httpClient.send(headRequest, HttpResponse.BodyHandlers.discarding());
            if (headResponse.statusCode() >= 200 && headResponse.statusCode() < 400) {
                return LinkVerificationResponseDto.builder()
                        .isLive(true)
                        .url(cleanUrl)
                        .message("Link is live! 🔥 (Verified via HEAD)")
                        .build();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("HEAD verification thread context interrupted.");
        } catch (Exception e) {
            // Log fallback alert context quietly without crashing
        }

        // --- Phase 2: Full GET Fallback Strategy ---
        try {
            HttpRequest getRequest = HttpRequest.newBuilder()
                    .uri(URI.create(cleanUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("User-Agent", randomUA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Cache-Control", "no-cache")
                    .GET()
                    .build();

            HttpResponse<Void> getResponse = httpClient.send(getRequest, HttpResponse.BodyHandlers.discarding());
            if (getResponse.statusCode() >= 200 && getResponse.statusCode() < 400) {
                return LinkVerificationResponseDto.builder()
                        .isLive(true)
                        .url(cleanUrl)
                        .message("Link is Live! 🔥 (Verified via GET)")
                        .build();
            }

            return LinkVerificationResponseDto.builder()
                    .isLive(false)
                    .url(cleanUrl)
                    .message("Link returned bad status code: " + getResponse.statusCode())
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("GET verification thread context interrupted.");
        } catch (Exception e) {
            // Handles connection timeouts, handshake failures seamlessly
        }

        return LinkVerificationResponseDto.builder()
                .isLive(false)
                .url(cleanUrl)
                .message("Link is dead or completely unreachable.")
                .build();
    }
}