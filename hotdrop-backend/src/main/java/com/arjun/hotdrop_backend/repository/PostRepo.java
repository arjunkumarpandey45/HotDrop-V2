package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PostRepo extends JpaRepository<Post, UUID> {
    Optional<Post> findByShareUrl(String shareUrl);
}