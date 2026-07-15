package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

import com.arjun.hotdrop_backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CommentRepo extends JpaRepository<Comment, UUID> {
   
    java.util.List<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId);
}