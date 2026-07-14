package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserRepo extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByHotdropId(String hotdropId);

    boolean existsByEmail(String email);

    boolean existsByHotdropId(String hotdropId);

    @Transactional
    @Modifying
    @Query("delete from User u where u.emailVerified=false and u.createdAt< :targetTime")
    int deleteUnverifiedUsersOlderThan(@Param("targetTime") LocalDateTime targetTime);

}
