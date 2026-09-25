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

        @Query(value = """
    SELECT * FROM users u 
    WHERE u.hotdrop_id ILIKE CONCAT('%', :query, '%') 
       OR u.first_name ILIKE CONCAT('%', :query, '%') 
       OR u.last_name ILIKE CONCAT('%', :query, '%') 
    ORDER BY u.hotdrop_id ASC 
    LIMIT 5
""", nativeQuery = true)
    List<User> searchTop5Users(@Param("query") String query);
    Optional<User> findByHotdropId(String hotdropId);

    @EntityGraph(attributePaths = {
            "roles" 
    })
    Optional<User> findById(UUID id);
    boolean existsByEmail(String email);

    boolean existsByHotdropId(String hotdropId);



}

