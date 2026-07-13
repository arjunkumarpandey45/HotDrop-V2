package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepo extends JpaRepository<Post, UUID> {
    Optional<Post> findByShareUrl(String shareUrl);
    @Query("SELECT p FROM Post p WHERE p.projectUrl IS NOT NULL AND p.projectUrl <> ''")
    List<Post> findAllWithActiveProjectLinks();
}