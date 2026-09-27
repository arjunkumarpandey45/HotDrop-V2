package com.arjun.hotdrop_backend.service.impl;



import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.service.PostAsyncService;
import com.arjun.hotdrop_backend.service.TechStackDetectorService;
import com.arjun.hotdrop_backend.utils.RedisEvictionHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostAsyncServiceImpl implements PostAsyncService {

    private final TechStackDetectorService techStackDetectorService;
    private final PostRepo postRepo;
    private final RedisEvictionHelper redisEvictionHelper;

    @Async("linkVerificationTaskExecutor")
    @Transactional
    @Override
    public void processTechStackAndStatusAsync(UUID postId, String projectUrl) {
        log.info("Background thread [{}] started tech stack detection for post: {}",
                Thread.currentThread().getName(), postId);

        if (projectUrl == null || projectUrl.isBlank()) {
            return;
        }

        try {
            Set<String> autoTags = techStackDetectorService.detectTechStack(projectUrl);
            if (autoTags == null || autoTags.isEmpty()) {
                log.info("No auto tags detected for post: {}", postId);
                return;
            }

            Post post = postRepo.findById(postId).orElse(null);
            if (post == null) {
                log.warn("Post {} not found during background tech detection", postId);
                return;
            }


            Set<String> updatedTags = new LinkedHashSet<>(post.getTags());
            autoTags.forEach(tag -> updatedTags.add(tag.trim().toLowerCase()));
            post.setTags(new java.util.ArrayList<>(updatedTags));

            postRepo.save(post);
            log.info("Successfully updated post {} with detected tags: {}", postId, updatedTags);


            redisEvictionHelper.evictCacheEntryExact("postDetails", postId.toString());
            if (post.getShareUrl() != null) {
                redisEvictionHelper.evictCacheEntriesByPrefix("postByShareUrl", "url:" + post.getShareUrl());
            }
            redisEvictionHelper.evictCacheEntriesByPrefix("userPostsPaged", "user:" + post.getUser().getId());
            redisEvictionHelper.evictEntireCache("compiledFeed");

        } catch (Exception e) {
            log.warn("Background tech stack detection failed for post {}: {}", postId, e.getMessage());
        }
    }
}
