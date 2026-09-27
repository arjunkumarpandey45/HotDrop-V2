package com.arjun.hotdrop_backend.service;

import java.util.UUID;

public interface PostAsyncService {
    void processTechStackAndStatusAsync(UUID postId, String projectUrl);
}