package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepo extends JpaRepository<Comment, UUID> {
    void deleteCommentById(UUID id);

    boolean existsById(@NonNull UUID id);

    Page<Comment> findByPostId(UUID postId, Pageable pageable);
}