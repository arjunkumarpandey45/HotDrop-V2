package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.UserOAuthAccount;
import com.arjun.hotdrop_backend.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOAuthAccountRepo extends JpaRepository<UserOAuthAccount, UUID> {

    Optional<UserOAuthAccount> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);

    List<UserOAuthAccount> findByUserId(UUID userId);

    Optional<UserOAuthAccount> findByUserIdAndProvider(UUID userId, AuthProvider provider);

    long countByUserId(UUID userId);

    boolean existsByProviderAndProviderUserId(AuthProvider provider, String providerUserId);

    void deleteByUserIdAndProvider(UUID userId, AuthProvider provider);
}
