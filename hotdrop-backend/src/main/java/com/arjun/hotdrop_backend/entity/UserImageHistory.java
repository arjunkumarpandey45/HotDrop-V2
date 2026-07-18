package com.arjun.hotdrop_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_image_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserImageHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;
    @Column(name = "public_id")
    private String publicId;
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
}
