package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Like;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface LikeRepo extends JpaRepository<Like, UUID> {

    Optional<Like> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);

    @Query(value = "SELECT pl.post_id FROM post_likes pl WHERE pl.user_id = :userId AND pl.post_id IN (:postIds)", nativeQuery = true)
    Set<UUID> findLikedPostIdsByUserIdAndPostIds(
            @Param("userId") UUID userId,
            @Param("postIds") List<UUID> postIds
    );
    Page<Like> findByPost(Post post, Pageable pageable);
}
