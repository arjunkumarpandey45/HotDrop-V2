package com.arjun.hotdrop_backend.repository;

import com.arjun.hotdrop_backend.entity.UserImageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
@Repository
public interface UserImageHistoryRepo extends JpaRepository<UserImageHistory, UUID> {
}