package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtpVerificationRepo extends JpaRepository<OtpVerification, UUID> {
    Optional<OtpVerification> findByEmail(String email);
    void deleteByEmail(String email);
}