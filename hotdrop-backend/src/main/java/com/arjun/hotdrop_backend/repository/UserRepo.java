package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.User;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepo extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    List<User> findTop5ByHotdropIdContainingIgnoreCaseOrFirstNameContainingIgnoreCase(String hotdropId, String firstName);
    Optional<User> findByHotdropId(String hotdropId);

    // Cleaned EntityGraph removing non-existent fields ('followers', 'following', 'posts')
    @EntityGraph(attributePaths = {
            "roles" // Eager fetch roles cleanly if needed
    })
    Optional<User> findById(UUID id);
    boolean existsByEmail(String email);

    boolean existsByHotdropId(String hotdropId);

    @Transactional
    @Modifying
    @Query("delete from User u where u.emailVerified=false and u.createdAt< :targetTime")
    int deleteUnverifiedUsersOlderThan(@Param("targetTime") LocalDateTime targetTime);

}
