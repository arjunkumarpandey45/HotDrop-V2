package com.arjun.hotdrop_backend.scheduler;

import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.repository.PostRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LinkTrackingScheduler {

    private final PostRepo postRepo;
    private final TransactionTemplate transactionTemplate;


    private final List<String> userAgents;
    private final Random random;

    private final ExecutorService ioExecutor = Executors.newFixedThreadPool(15, r -> {
        Thread t = new Thread(r);
        t.setName("link-tracker-io-");
        t.setDaemon(true);
        return t;
    });

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Scheduled(fixedDelay = 300000)
    public void startLiveTracking() {
        log.info("--- 🛡️ Upgraded Multi-threaded Tracking Started: {} ---", LocalDateTime.now());

        try {
            List<Post> allPosts = transactionTemplate.execute(status -> postRepo.findAllWithActiveProjectLinks());

            if (allPosts == null || allPosts.isEmpty()) {
                log.info("No active links found to monitor.");
                return;
            }

            List<String> uniqueLinks = allPosts.stream()
                    .map(Post::getProjectUrl)
                    .distinct()
                    .toList();

            Map<String, Boolean> trackingResults = new ConcurrentHashMap<>();
            log.info("🔍 Parallel scanning of {} unique URLs...", uniqueLinks.size());

            int batchSize = 5;
            for (int i = 0; i < uniqueLinks.size(); i += batchSize) {
                int end = Math.min(i + batchSize, uniqueLinks.size());
                List<String> batch = uniqueLinks.subList(i, end);

                List<CompletableFuture<Void>> futures = batch.stream()
                        .map(link -> CompletableFuture.runAsync(() -> pingUrl(link, trackingResults), ioExecutor))
                        .toList();

                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

                if (end < uniqueLinks.size()) {
                    log.info("⏳ Batch complete. Human cooldown mimicking active...");
                    TimeUnit.SECONDS.sleep(3);
                }
            }

            // Executive isolated transaction mapping
            log.info("💾 Flushing structural link updates down into PostgreSQL layer...");
            transactionTemplate.executeWithoutResult(status -> {
                for (Post post : allPosts) {
                    Boolean isDead = trackingResults.getOrDefault(post.getProjectUrl(), false);
                    post.setLinkDead(isDead);
                    post.setLastChecked(LocalDateTime.now());
                }
                postRepo.saveAll(allPosts);
            });

            log.info("--- ✅ DB Batch Update Successful without proxy issues ---");

        } catch (InterruptedException ie) {
            log.error("Tracking thread context interrupted unexpectedly: {}", ie.getMessage());
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("Critical error inside tracking cron execution flow: {}", e.getMessage());
        }
    }

    private void pingUrl(String link, Map<String, Boolean> results) {
        long startTime = System.nanoTime();

        String randomUA = userAgents.get(java.util.concurrent.ThreadLocalRandom.current().nextInt(userAgents.size()));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(link))
                    .header("User-Agent", randomUA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Cache-Control", "no-cache")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            long durationNs = System.nanoTime() - startTime;
            double durationSec = durationNs / 1_000_000_000.0;

            if (response.statusCode() >= 200 && response.statusCode() < 400) {
                results.put(link, false);
                log.info("✅ [ALIVE] ({}) | Responded in {}s", link, String.format("%.2f", durationSec));
            } else {
                results.put(link, true);
                log.info("❌ [BAD STATUS]: {} | Code: {}", link, response.statusCode());
            }
        } catch (Exception err) {
            results.put(link, true);
            log.info("❌ [DEAD/TIMEOUT]: {} | Error: {}", link, err.getMessage());
        }
    }
}