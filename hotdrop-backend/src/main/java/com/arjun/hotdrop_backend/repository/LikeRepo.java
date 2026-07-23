package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Like;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
@Repository
public interface LikeRepo extends JpaRepository<Like, UUID> {

    Optional<Like> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);


    // OR directly using IDs
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);


   ;
}
