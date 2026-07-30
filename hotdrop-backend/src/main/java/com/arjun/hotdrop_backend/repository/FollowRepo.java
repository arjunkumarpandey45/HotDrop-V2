package com.arjun.hotdrop_backend.repository;
import com.arjun.hotdrop_backend.entity.Follow;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface FollowRepo extends JpaRepository<Follow, UUID> {
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    boolean existsByFollowerAndFollowing(User follower, User following);
    List<Follow> findAllByFollowing(User targetUser);
    List<Follow> findAllByFollower(User currentUser);
    int countByFollowing(User user); 
    int countByFollower(User user);
    List<Follow> findByFollower(User targetUser);
    List<Follow> findByFollowing(User targetUser);
}