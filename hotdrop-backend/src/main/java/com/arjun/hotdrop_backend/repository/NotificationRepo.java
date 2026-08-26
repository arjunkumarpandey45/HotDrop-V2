package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Notification;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NotificationRepo extends JpaRepository<Notification, UUID> {
    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);
    long countByRecipientAndIsReadFalse(User recipient);
}