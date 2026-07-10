package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepo extends JpaRepository<Role, UUID> {

    Optional<Role> findByRoleName(RoleType roleName);
}
