package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.Follow;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.Role;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.enums.RoleType;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.*;
import com.arjun.hotdrop_backend.service.impl.UserServiceImpl;
import com.arjun.hotdrop_backend.utils.RedisEvictionHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private CloudinaryService cloudinary;
    @Mock
    private PostRepo postRepo;
    @Mock
    private UserRepo userRepo;
    @Mock
    private FollowRepo followRepo;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PostMapper postMapper;
    @Mock
    private NotificationService notificationService;
    @Mock
    private LikeRepo likeRepo;
    @Mock
    private UserImageHistoryRepo userImageHistoryRepo;
    @Mock
    private RedisEvictionHelper redisEvictionHelper;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;
    private User targetUser;
    private UUID sampleUserId;
    private UUID targetUserId;

    @BeforeEach
    void setUp() {
        sampleUserId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        Role role = Role.builder().id(UUID.randomUUID()).roleName(RoleType.USER).build();

        sampleUser = User.builder()
                .id(sampleUserId)
                .hotdropId("current_dev")
                .email("current@hotdrop.io")
                .firstName("Arjun")
                .lastName("Pandey")
                .roles(Set.of(role))
                .profileImageUrl("https://res.cloudinary.com/demo/image/upload/v1/sample_old.jpg")
                .profileImagePublicId("sample_old")
                .build();

        targetUser = User.builder()
                .id(targetUserId)
                .hotdropId("target_dev")
                .email("target@hotdrop.io")
                .firstName("Target")
                .lastName("Dev")
                .roles(Set.of(role))
                .build();
    }

    @Nested
    @DisplayName("getUserByHotDropId Tests")
    class GetUserByHotDropIdTests {

        @Test
        @DisplayName("Should successfully return public profile with isOwner=true when viewer is the owner")
        void getUserByHotDropId_OwnerViewer_Success() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(postRepo.countByUser(sampleUser)).thenReturn(3);
            when(followRepo.countByFollowing(sampleUser)).thenReturn(10);
            when(followRepo.countByFollower(sampleUser)).thenReturn(5);

            UserResponseOnSearchDto mockResponse = new UserResponseOnSearchDto();
            when(userMapper.toSearchResponseDto(sampleUser, true, 3, 10, 5)).thenReturn(mockResponse);

            UserResponseOnSearchDto result = userService.getUserByHotDropId("current_dev", "current_dev");

            assertThat(result).isNotNull();
            verify(userMapper).toSearchResponseDto(sampleUser, true, 3, 10, 5);
        }

        @Test
        @DisplayName("Should successfully return public profile with isOwner=false when viewer is guest or other user")
        void getUserByHotDropId_OtherViewer_Success() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(postRepo.countByUser(sampleUser)).thenReturn(3);
            when(followRepo.countByFollowing(sampleUser)).thenReturn(10);
            when(followRepo.countByFollower(sampleUser)).thenReturn(5);

            UserResponseOnSearchDto mockResponse = new UserResponseOnSearchDto();
            when(userMapper.toSearchResponseDto(sampleUser, false, 3, 10, 5)).thenReturn(mockResponse);

            UserResponseOnSearchDto result = userService.getUserByHotDropId("current_dev", "other_dev");

            assertThat(result).isNotNull();
            verify(userMapper).toSearchResponseDto(sampleUser, false, 3, 10, 5);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user is not found")
        void getUserByHotDropId_UserNotFound_ThrowsException() {
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserByHotDropId("unknown_dev", "viewer"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User profile not found with ID: unknown_dev");
        }
    }

    @Nested
    @DisplayName("toggleFollowUser Tests")
    class ToggleFollowUserTests {

        @Test
        @DisplayName("Should follow user when not previously followed and send notification")
        void toggleFollowUser_Follow_Success() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.findById(targetUserId)).thenReturn(Optional.of(targetUser));
            when(followRepo.findByFollowerAndFollowing(sampleUser, targetUser)).thenReturn(Optional.empty());
            when(followRepo.countByFollowing(targetUser)).thenReturn(1);

            FollowResponseDto mockDto = new FollowResponseDto();
            when(userMapper.toFollowResponseDto(true, 1, targetUser)).thenReturn(mockDto);

            FollowResponseDto result = userService.toggleFollowUser(targetUserId, "current_dev");

            assertThat(result).isNotNull();
            verify(followRepo).save(any(Follow.class));
            verify(notificationService).sendNotification(
                    eq(sampleUser),
                    eq(targetUser),
                    eq(NotificationType.FOLLOW),
                    eq(" started following you."),
                    eq(sampleUser.getId())
            );
            verify(redisEvictionHelper, atLeastOnce()).evictCacheEntriesByPrefix(eq("publicUserProfiles"), anyString());
        }

        @Test
        @DisplayName("Should unfollow user when already followed without sending notification")
        void toggleFollowUser_Unfollow_Success() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.findById(targetUserId)).thenReturn(Optional.of(targetUser));
            Follow existingFollow = Follow.builder().follower(sampleUser).following(targetUser).build();
            when(followRepo.findByFollowerAndFollowing(sampleUser, targetUser)).thenReturn(Optional.of(existingFollow));
            when(followRepo.countByFollowing(targetUser)).thenReturn(0);

            FollowResponseDto mockDto = new FollowResponseDto();
            when(userMapper.toFollowResponseDto(false, 0, targetUser)).thenReturn(mockDto);

            FollowResponseDto result = userService.toggleFollowUser(targetUserId, "current_dev");

            assertThat(result).isNotNull();
            verify(followRepo).delete(existingFollow);
            verifyNoInteractions(notificationService);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when user tries to follow themselves")
        void toggleFollowUser_SelfFollow_ThrowsException() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.findById(sampleUserId)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.toggleFollowUser(sampleUserId, "current_dev"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("You cannot follow yourself");

            verify(followRepo, never()).save(any(Follow.class));
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when authenticated user not found")
        void toggleFollowUser_CurrentUserNotFound_ThrowsException() {
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.toggleFollowUser(targetUserId, "unknown_dev"))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Authenticated user not found");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when target user not found")
        void toggleFollowUser_TargetUserNotFound_ThrowsException() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.findById(targetUserId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.toggleFollowUser(targetUserId, "current_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Target user not found");
        }
    }

    @Nested
    @DisplayName("getUserFollowers and getFollowingList Tests")
    class FollowListsTests {

        @Test
        @DisplayName("getUserFollowers should return paged followers with isFollowingBack resolved")
        void getUserFollowers_Success() {
            when(userRepo.findById(targetUserId)).thenReturn(Optional.of(targetUser));
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));

            Follow follow = Follow.builder().follower(sampleUser).following(targetUser).build();
            Page<Follow> followPage = new PageImpl<>(List.of(follow));
            when(followRepo.findByFollowing(eq(targetUser), any(Pageable.class))).thenReturn(followPage);
            when(followRepo.existsByFollowerAndFollowing(sampleUser, sampleUser)).thenReturn(false);

            FollowerUserDto mockDto = new FollowerUserDto();
            when(userMapper.toFollowerUserDto(sampleUser, false)).thenReturn(mockDto);

            PagedResponse<FollowerUserDto> result = userService.getUserFollowers(targetUserId, "current_dev", 0, 10);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("getUserFollowers should throw ResourceNotFoundException when profile user not found")
        void getUserFollowers_NotFound_ThrowsException() {
            when(userRepo.findById(targetUserId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserFollowers(targetUserId, "current_dev", 0, 10))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Profile user not found");
        }

        @Test
        @DisplayName("getFollowingList should return paged accounts followed by target user")
        void getFollowingList_Success() {
            when(userRepo.findById(sampleUserId)).thenReturn(Optional.of(sampleUser));
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));

            Follow follow = Follow.builder().follower(sampleUser).following(targetUser).build();
            Page<Follow> followPage = new PageImpl<>(List.of(follow));
            when(followRepo.findByFollower(eq(sampleUser), any(Pageable.class))).thenReturn(followPage);
            when(followRepo.existsByFollowerAndFollowing(sampleUser, targetUser)).thenReturn(true);

            FollowerUserDto mockDto = new FollowerUserDto();
            when(userMapper.toFollowerUserDto(targetUser, true)).thenReturn(mockDto);

            PagedResponse<FollowerUserDto> result = userService.getFollowingList(sampleUserId, "current_dev", 0, 10);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateProfileDetails Tests")
    class UpdateProfileDetailsTests {

        @Test
        @DisplayName("Should successfully update profile details including avatar upload")
        void updateProfileDetails_Success() {
            ProfileUpdateRequestDto request = new ProfileUpdateRequestDto();
            request.setHotdropId("updateddev");
            request.setFirstName("ArjunUpdated");
            request.setLastName("PandeyUpdated");
            request.setBio("Updated bio");

            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.isEmpty()).thenReturn(false);
            request.setProfilePicture(mockFile);

            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.existsByHotdropId("updateddev")).thenReturn(false);

            when(cloudinary.uploadImageForProfileImage(mockFile)).thenReturn(Map.of(
                    "url", "https://res.cloudinary.com/demo/image/upload/v1/new_avatar.jpg",
                    "publicId", "new_avatar"
            ));
            when(userRepo.saveAndFlush(sampleUser)).thenReturn(sampleUser);
            when(postRepo.countByUser(sampleUser)).thenReturn(2);
            when(followRepo.countByFollowing(sampleUser)).thenReturn(5);
            when(followRepo.countByFollower(sampleUser)).thenReturn(3);

            UserResponseDto mockResponseDto = new UserResponseDto();
            when(userMapper.toResponseDto(sampleUser, 2, 5, 3)).thenReturn(mockResponseDto);

            UserResponseDto result = userService.updateProfileDetails(sampleUserId, "current_dev", request);

            assertThat(result).isNotNull();
            assertThat(sampleUser.getHotdropId()).isEqualTo("updateddev");
            assertThat(sampleUser.getFirstName()).isEqualTo("ArjunUpdated");
            assertThat(sampleUser.getBio()).isEqualTo("Updated bio");
            assertThat(sampleUser.getProfileImageUrl()).isEqualTo("https://res.cloudinary.com/demo/image/upload/v1/new_avatar.jpg");
            verify(userImageHistoryRepo).save(any());
            verify(redisEvictionHelper, atLeastOnce()).evictCacheEntriesByPrefix(eq("publicUserProfiles"), anyString());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when hotdropId contains invalid characters")
        void updateProfileDetails_InvalidHotdropId_ThrowsException() {
            ProfileUpdateRequestDto request = new ProfileUpdateRequestDto();
            request.setHotdropId("invalid-dev-with-hyphen!");

            assertThatThrownBy(() -> userService.updateProfileDetails(sampleUserId, "current_dev", request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Hotdrop ID can only contain letters and numbers");

            verifyNoInteractions(userRepo);
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when params userId does not match authenticated user")
        void updateProfileDetails_NotOwner_ThrowsException() {
            ProfileUpdateRequestDto request = new ProfileUpdateRequestDto();
            request.setHotdropId("newdev");

            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.updateProfileDetails(UUID.randomUUID(), "current_dev", request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Access Denied: You are not the owner of this profile");

            verify(userRepo, never()).saveAndFlush(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when new hotdropId is already taken")
        void updateProfileDetails_HotdropIdTaken_ThrowsException() {
            ProfileUpdateRequestDto request = new ProfileUpdateRequestDto();
            request.setHotdropId("takendev");

            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.existsByHotdropId("takendev")).thenReturn(true);

            assertThatThrownBy(() -> userService.updateProfileDetails(sampleUserId, "current_dev", request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("HotdropId is already taken");

            verify(userRepo, never()).saveAndFlush(any(User.class));
        }

        @Test
        @DisplayName("Should throw IllegalStateException when profile picture upload fails")
        void updateProfileDetails_CloudinaryFails_ThrowsException() {
            ProfileUpdateRequestDto request = new ProfileUpdateRequestDto();
            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.isEmpty()).thenReturn(false);
            request.setProfilePicture(mockFile);

            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(cloudinary.uploadImageForProfileImage(mockFile)).thenThrow(new RuntimeException("Cloudinary service down"));

            assertThatThrownBy(() -> userService.updateProfileDetails(sampleUserId, "current_dev", request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("File upload sequence processing failed due to an external service error.");

            verify(userRepo, never()).saveAndFlush(any(User.class));
        }
    }

    @Nested
    @DisplayName("getMe and searchTop5Users Tests")
    class GetMeAndSearchTests {

        @Test
        @DisplayName("getMe should return full account details and posts for authenticated user")
        void getMe_Success() {
            when(userRepo.findById(sampleUserId)).thenReturn(Optional.of(sampleUser));

            Post post = Post.builder().id(UUID.randomUUID()).title("Post 1").user(sampleUser).build();
            when(postRepo.findByUserIdOrderByCreatedAtDesc(sampleUserId)).thenReturn(List.of(post));
            when(followRepo.countByFollowing(sampleUser)).thenReturn(4);
            when(followRepo.countByFollower(sampleUser)).thenReturn(2);
            when(likeRepo.findLikedPostIdsByUserIdAndPostIds(eq(sampleUserId), anyList())).thenReturn(Set.of(post.getId()));

            UserResponseDto userDto = new UserResponseDto();
            when(userMapper.toResponseDto(sampleUser, 1, 4, 2)).thenReturn(userDto);
            PostResponseDto.UserSummaryDto creatorDto = new PostResponseDto.UserSummaryDto();
            when(postMapper.toUserSummaryDto(sampleUser)).thenReturn(creatorDto);
            PostResponseDto postDto = new PostResponseDto();
            when(postMapper.toResponseDto(post, true, creatorDto)).thenReturn(postDto);

            MeResponseDto mockMeResponse = new MeResponseDto();
            when(userMapper.toMeResponseDto(userDto, List.of(postDto))).thenReturn(mockMeResponse);

            MeResponseDto result = userService.getMe(sampleUserId);

            assertThat(result).isNotNull();
            verify(userMapper).toMeResponseDto(userDto, List.of(postDto));
        }

        @Test
        @DisplayName("getMeByHotdropId should delegate to getMe(userId)")
        void getMeByHotdropId_Success() {
            when(userRepo.findByHotdropId("current_dev")).thenReturn(Optional.of(sampleUser));
            when(userRepo.findById(sampleUserId)).thenReturn(Optional.of(sampleUser));
            when(postRepo.findByUserIdOrderByCreatedAtDesc(sampleUserId)).thenReturn(Collections.emptyList());

            UserResponseDto userDto = new UserResponseDto();
            when(userMapper.toResponseDto(sampleUser, 0, 0, 0)).thenReturn(userDto);
            MeResponseDto mockMeResponse = new MeResponseDto();
            when(userMapper.toMeResponseDto(eq(userDto), anyList())).thenReturn(mockMeResponse);

            MeResponseDto result = userService.getMeByHotdropId("current_dev");

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("searchTop5Users should return empty list when query is null or blank")
        void searchTop5Users_NullOrBlank_ReturnsEmpty() {
            assertThat(userService.searchTop5Users(null)).isEmpty();
            assertThat(userService.searchTop5Users("   ")).isEmpty();

            verifyNoInteractions(userRepo);
        }

        @Test
        @DisplayName("searchTop5Users should return mapped user summaries when query matches")
        void searchTop5Users_Success() {
            when(userRepo.searchTop5Users("arjun")).thenReturn(List.of(sampleUser));
            PostResponseDto.UserSummaryDto summaryDto = new PostResponseDto.UserSummaryDto();
            when(postMapper.toUserSummaryDto(sampleUser)).thenReturn(summaryDto);

            List<PostResponseDto.UserSummaryDto> results = userService.searchTop5Users("arjun");

            assertThat(results).containsExactly(summaryDto);
        }
    }
}
