package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.RefreshToken;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepo extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}