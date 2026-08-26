package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepo extends JpaRepository<Post, UUID> {
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    void incrementLikeCount(@Param("postId") UUID postId);
    Page<Post> findByUserId(UUID userId, Pageable pageable);
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = CASE WHEN p.likeCount > 0 THEN p.likeCount - 1 ELSE 0 END WHERE p.id = :postId")
    void decrementLikeCount(@Param("postId") UUID postId);

    @Query("SELECT p FROM Post p WHERE p.projectUrl IS NOT NULL AND p.projectUrl <> ''")
    List<Post> findAllWithActiveProjectLinks();
    @Query(value = "SELECT p.* FROM posts p WHERE :keyword IS NULL OR " +
            "LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE LOWER(tag) LIKE LOWER(CONCAT('%', :keyword, '%')))",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE :keyword IS NULL OR " +
                    "LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                    "EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE LOWER(tag) LIKE LOWER(CONCAT('%', :keyword, '%')))",
            nativeQuery = true)
    Page<Post> searchFeedEngine(@Param("keyword") String keyword, Pageable pageable);
    List<Post> findByUserId(UUID userId);
    int countByUser(User user);
    List<Post> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Post> findByShareUrl(String shareUrl);

    boolean existsByShareUrl(String shareUrl);

    boolean existsById(@NonNull UUID postId);
}

