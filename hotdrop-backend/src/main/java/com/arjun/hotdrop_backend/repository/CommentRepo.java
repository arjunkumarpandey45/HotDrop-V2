package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepo extends JpaRepository<Comment, UUID> {
    void deleteCommentById(UUID id);

    boolean existsById(@NonNull UUID id);

    java.util.List<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId);

}