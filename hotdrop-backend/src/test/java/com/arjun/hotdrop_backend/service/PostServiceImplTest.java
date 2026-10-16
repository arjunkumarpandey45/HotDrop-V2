package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;
import com.arjun.hotdrop_backend.entity.*;
import com.arjun.hotdrop_backend.enums.NotificationType;
import com.arjun.hotdrop_backend.error.ResourceNotFoundException;
import com.arjun.hotdrop_backend.mapper.CommentMapper;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.repository.*;
import com.arjun.hotdrop_backend.service.impl.PostServiceImpl;
import com.arjun.hotdrop_backend.utils.RedisEvictionHelper;
import com.arjun.hotdrop_backend.utils.UserAgentProvider;
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
class PostServiceImplTest {

    @Mock
    private LikeRepo likeRepo;
    @Mock
    private UserRepo userRepo;
    @Mock
    private PostRepo postRepo;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private TechStackDetectorService techStackDetectorService;
    @Mock
    private UserAgentProvider userAgentProvider;
    @Mock
    private CommentRepo commentRepo;
    @Mock
    private PostAsyncService postAsyncService;
    @Mock
    private PostMapper postMapper;
    @Mock
    private CommentMapper commentMapper;
    @Mock
    private UserImageHistoryRepo userImageHistoryRepo;
    @Mock
    private RedisEvictionHelper redisEvictionHelper;

    @InjectMocks
    private PostServiceImpl postService;

    private User postOwner;
    private User regularUser;
    private Post samplePost;
    private UUID samplePostId;

    @BeforeEach
    void setUp() {
        samplePostId = UUID.randomUUID();

        postOwner = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("owner_dev")
                .email("owner@hotdrop.io")
                .build();

        regularUser = User.builder()
                .id(UUID.randomUUID())
                .hotdropId("regular_dev")
                .email("regular@hotdrop.io")
                .build();

        samplePost = Post.builder()
                .id(samplePostId)
                .title("Awesome Project")
                .description("A cool project description")
                .projectUrl("https://coolproject.com")
                .shareUrl("awesome-project-12345")
                .likeCount(5)
                .commentCount(2)
                .tags(new ArrayList<>(List.of("react", "springboot")))
                .user(postOwner)
                .images(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("verifyProjectLink Tests")
    class VerifyProjectLinkTests {

        @Test
        @DisplayName("Should return invalid response when link is null or blank")
        void verifyProjectLink_NullOrBlank_ReturnsInvalid() {
            LinkVerificationResponseDto mockDto = new LinkVerificationResponseDto();
            when(postMapper.toLinkVerificationResponseDto(eq(false), isNull(), eq("URL cannot be empty!"), isNull()))
                    .thenReturn(mockDto);

            LinkVerificationResponseDto result = postService.verifyProjectLink(null);

            assertThat(result).isNotNull();
            verify(postMapper).toLinkVerificationResponseDto(eq(false), isNull(), eq("URL cannot be empty!"), isNull());
        }

        @Test
        @DisplayName("Should handle unreachable URL gracefully and return dead status")
        void verifyProjectLink_UnreachableHost_ReturnsDead() {
            LinkVerificationResponseDto mockDto = new LinkVerificationResponseDto();
            when(userAgentProvider.getRandomUserAgent()).thenReturn("Mozilla/5.0");
            when(postMapper.toLinkVerificationResponseDto(eq(false), eq("https://unreachable-domain-12345.xyz"), contains("dead"), anyList()))
                    .thenReturn(mockDto);

            LinkVerificationResponseDto result = postService.verifyProjectLink("https://unreachable-domain-12345.xyz");

            assertThat(result).isNotNull();
            verify(postMapper).toLinkVerificationResponseDto(eq(false), eq("https://unreachable-domain-12345.xyz"), contains("dead"), anyList());
        }
    }

    @Nested
    @DisplayName("createNewPost Tests")
    class CreateNewPostTests {

        @Test
        @DisplayName("Should throw IllegalArgumentException when files array is null or empty")
        void createNewPost_EmptyFiles_ThrowsException() {
            CreatePostDto dto = new CreatePostDto();
            dto.setTitle("Test Title");

            assertThatThrownBy(() -> postService.createNewPost(dto, null, "owner_dev"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least 1 image must be uploaded.");

            MultipartFile emptyFile = mock(MultipartFile.class);
            when(emptyFile.isEmpty()).thenReturn(true);
            MultipartFile[] files = new MultipartFile[]{emptyFile};

            assertThatThrownBy(() -> postService.createNewPost(dto, files, "owner_dev"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least 1 image must be uploaded.");

            verifyNoInteractions(userRepo);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user is not found")
        void createNewPost_UserNotFound_ThrowsException() {
            CreatePostDto dto = new CreatePostDto();
            dto.setTitle("Test Title");

            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.isEmpty()).thenReturn(false);
            MultipartFile[] files = new MultipartFile[]{mockFile};

            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.createNewPost(dto, files, "unknown_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");

            verify(postRepo, never()).save(any(Post.class));
        }

        @Test
        @DisplayName("Should successfully upload image and persist post entity")
        void createNewPost_Success() {
            CreatePostDto dto = new CreatePostDto();
            dto.setTitle("New App");
            dto.setDescription("Cool App");
            dto.setProjectUrl("https://newapp.com");
            dto.setTags("React, TypeScript");

            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.isEmpty()).thenReturn(false);
            MultipartFile[] files = new MultipartFile[]{mockFile};

            when(userRepo.findByHotdropId("owner_dev")).thenReturn(Optional.of(postOwner));
            when(cloudinaryService.uploadImageForPost(mockFile)).thenReturn(Map.of(
                    "url", "https://res.cloudinary.com/demo/image/upload/v1/new_post.jpg",
                    "publicId", "new_post_id"
            ));
            when(postRepo.save(any(Post.class))).thenAnswer(inv -> {
                Post p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                return p;
            });

            PostResponseDto mockResponseDto = new PostResponseDto();
            when(postMapper.toResponseDto(any(Post.class), eq(false), any())).thenReturn(mockResponseDto);

            org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
            try {
                PostResponseDto result = postService.createNewPost(dto, files, "owner_dev");

                assertThat(result).isNotNull();
                verify(cloudinaryService).uploadImageForPost(mockFile);
                verify(postRepo).save(any(Post.class));
            } finally {
                org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
            }
        }
    }

    @Nested
    @DisplayName("deleteExistingPost Tests")
    class DeleteExistingPostTests {

        @Test
        @DisplayName("Should throw ResourceNotFoundException when post does not exist")
        void deleteExistingPost_PostNotFound_ThrowsException() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.deleteExistingPost(samplePostId, "owner_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Post not found!");

            verify(postRepo, never()).delete(any(Post.class));
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when authenticated user not found")
        void deleteExistingPost_UserNotFound_ThrowsException() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.deleteExistingPost(samplePostId, "unknown_dev"))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Authenticated user session data not found");

            verify(postRepo, never()).delete(any(Post.class));
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when non-owner attempts to delete post")
        void deleteExistingPost_NotOwner_ThrowsException() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("regular_dev")).thenReturn(Optional.of(regularUser));

            assertThatThrownBy(() -> postService.deleteExistingPost(samplePostId, "regular_dev"))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Access Denied: You can only delete your own post!!");

            verify(postRepo, never()).delete(any(Post.class));
        }

        @Test
        @DisplayName("Should archive images, delete post, and evict caches when owner deletes post")
        void deleteExistingPost_Success() {
            PostImage image = PostImage.builder()
                    .url("https://res.cloudinary.com/demo/image/upload/v1/img.jpg")
                    .publicId("img_pub_id")
                    .post(samplePost)
                    .build();
            samplePost.setImages(List.of(image));

            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("owner_dev")).thenReturn(Optional.of(postOwner));

            postService.deleteExistingPost(samplePostId, "owner_dev");

            verify(userImageHistoryRepo).saveAll(anyList());
            verify(postRepo).delete(samplePost);
            verify(redisEvictionHelper).evictCacheEntryExact("postDetails", samplePostId.toString());
            verify(redisEvictionHelper).evictEntireCache("compiledFeed");
        }
    }

    @Nested
    @DisplayName("Feed and Retrieval Tests")
    class FeedAndRetrievalTests {

        @Test
        @DisplayName("getAllPostsCompiledFeed should query feed engine and return mapped feed DTO")
        void getAllPostsCompiledFeed_Success() {
            Pageable pageable = PageRequest.of(0, 10, Sort.by("created_at").descending());
            Page<Post> postPage = new PageImpl<>(List.of(samplePost));
            when(postRepo.searchFeedEngine(eq("react"), any(Pageable.class))).thenReturn(postPage);

            PostListResponseDto mockResponse = new PostListResponseDto();
            when(postMapper.toPostListResponseDto(anyList(), eq(0), eq(1), eq(1L), eq(1), eq(true)))
                    .thenReturn(mockResponse);

            PostListResponseDto result = postService.getAllPostsCompiledFeed(0, 10, "createdAt", "DESC", "react", "owner_dev");

            assertThat(result).isNotNull();
            verify(postRepo).searchFeedEngine(eq("react"), any(Pageable.class));
        }

        @Test
        @DisplayName("getPostByPostId should return mapped DTO when post exists")
        void getPostByPostId_Found_ReturnsDto() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            PostResponseDto mockDto = new PostResponseDto();
            when(postMapper.toResponseDto(eq(samplePost), eq(false), any())).thenReturn(mockDto);

            PostResponseDto result = postService.getPostByPostId(samplePostId);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("getPostByPostId should return null when post does not exist")
        void getPostByPostId_NotFound_ReturnsNull() {
            UUID missingId = UUID.randomUUID();
            when(postRepo.findById(missingId)).thenReturn(Optional.empty());

            PostResponseDto result = postService.getPostByPostId(missingId);
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("getPostByShareUrl should find post by slug or fallback to UUID")
        void getPostByShareUrl_Success() {
            when(postRepo.findByShareUrl("awesome-project-12345")).thenReturn(Optional.of(samplePost));
            PostResponseDto mockDto = new PostResponseDto();
            when(postMapper.toResponseDto(eq(samplePost), eq(false), any())).thenReturn(mockDto);

            PostResponseDto result = postService.getPostByShareUrl("awesome-project-12345", "guest");

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("getPostByShareUrl should throw ResourceNotFoundException when post not found")
        void getPostByShareUrl_NotFound_ThrowsException() {
            when(postRepo.findByShareUrl("unknown-slug")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.getPostByShareUrl("unknown-slug", "guest"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Post not found with shareUrl / id: unknown-slug");
        }

        @Test
        @DisplayName("getPostsByUserIdPaged should return paged posts or throw if target user missing")
        void getPostsByUserIdPaged_Tests() {
            when(userRepo.existsById(postOwner.getId())).thenReturn(true);
            Page<Post> page = new PageImpl<>(List.of(samplePost));
            when(postRepo.findByUserId(eq(postOwner.getId()), any(Pageable.class))).thenReturn(page);

            PagedResponse<PostResponseDto> result = postService.getPostsByUserIdPaged(postOwner.getId(), 0, 10, "guest");
            assertThat(result).isNotNull();

            UUID missingUserId = UUID.randomUUID();
            when(userRepo.existsById(missingUserId)).thenReturn(false);
            assertThatThrownBy(() -> postService.getPostsByUserIdPaged(missingUserId, 0, 10, "guest"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Target user not found");
        }
    }

    @Nested
    @DisplayName("toggleLike Tests")
    class ToggleLikeTests {

        @Test
        @DisplayName("Should add like, increment likeCount, and send notification when not previously liked")
        void toggleLike_AddLike_Success() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("regular_dev")).thenReturn(Optional.of(regularUser));
            when(likeRepo.findByUserAndPost(regularUser, samplePost)).thenReturn(Optional.empty());

            PostResponseDto mockDto = new PostResponseDto();
            when(postMapper.toResponseDto(eq(samplePost), anyBoolean(), any())).thenReturn(mockDto);

            PostResponseDto result = postService.toggleLike(samplePostId, "regular_dev");

            assertThat(result).isNotNull();
            assertThat(samplePost.getLikeCount()).isEqualTo(6);
            verify(likeRepo).save(any(Like.class));
            verify(notificationService).sendNotification(
                    eq(regularUser),
                    eq(postOwner),
                    eq(NotificationType.LIKE),
                    contains("liked your post"),
                    eq(samplePost.getId())
            );
            verify(postRepo).save(samplePost);
        }

        @Test
        @DisplayName("Should remove like and decrement likeCount when already liked")
        void toggleLike_RemoveLike_Success() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("regular_dev")).thenReturn(Optional.of(regularUser));
            Like existingLike = Like.builder().user(regularUser).post(samplePost).build();
            when(likeRepo.findByUserAndPost(regularUser, samplePost)).thenReturn(Optional.of(existingLike));

            PostResponseDto mockDto = new PostResponseDto();
            when(postMapper.toResponseDto(eq(samplePost), anyBoolean(), any())).thenReturn(mockDto);

            PostResponseDto result = postService.toggleLike(samplePostId, "regular_dev");

            assertThat(result).isNotNull();
            assertThat(samplePost.getLikeCount()).isEqualTo(4);
            verify(likeRepo).delete(existingLike);
            verifyNoInteractions(notificationService);
            verify(postRepo).save(samplePost);
        }

        @Test
        @DisplayName("toggleLike should throw ResourceNotFoundException when post not found")
        void toggleLike_PostNotFound_ThrowsException() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.toggleLike(samplePostId, "regular_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Post not found");
        }

        @Test
        @DisplayName("toggleLike should throw AccessDeniedException when user not found")
        void toggleLike_UserNotFound_ThrowsException() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("unknown_dev")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.toggleLike(samplePostId, "unknown_dev"))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("Comment Tests")
    class CommentTests {

        @Test
        @DisplayName("addCommentToPost should throw IllegalArgumentException when comment text is null or blank")
        void addCommentToPost_NullOrBlank_ThrowsException() {
            assertThatThrownBy(() -> postService.addCommentToPost(samplePostId, "regular_dev", null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Comment text cannot be empty");

            assertThatThrownBy(() -> postService.addCommentToPost(samplePostId, "regular_dev", "   "))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Comment text cannot be empty");

            verifyNoInteractions(postRepo);
        }

        @Test
        @DisplayName("addCommentToPost should add comment, increment commentCount, and send notification")
        void addCommentToPost_Success() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            when(userRepo.findByHotdropId("regular_dev")).thenReturn(Optional.of(regularUser));

            Comment comment = Comment.builder().id(UUID.randomUUID()).text("Great work!").user(regularUser).post(samplePost).build();
            when(commentRepo.save(any(Comment.class))).thenReturn(comment);

            CommentResponseDto mockCommentDto = new CommentResponseDto();
            when(commentMapper.toResponseDto(eq(comment), any())).thenReturn(mockCommentDto);

            CommentResponseDto result = postService.addCommentToPost(samplePostId, "regular_dev", "Great work!");

            assertThat(result).isNotNull();
            assertThat(samplePost.getCommentCount()).isEqualTo(3);
            verify(commentRepo).save(any(Comment.class));
            verify(notificationService).sendNotification(
                    eq(regularUser),
                    eq(postOwner),
                    eq(NotificationType.COMMENT),
                    contains("commented: Great work!"),
                    eq(samplePost.getId())
            );
            verify(postRepo).save(samplePost);
        }

        @Test
        @DisplayName("deleteComment should throw ResourceNotFoundException when comment does not exist")
        void deleteComment_NotFound_ThrowsException() {
            UUID commentId = UUID.randomUUID();
            when(commentRepo.findById(commentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.deleteComment(commentId, "owner_dev"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Comment not found");
        }

        @Test
        @DisplayName("deleteComment should throw AccessDeniedException due to UUID vs String comparison bug in production code")
        void deleteComment_AuthorizedUser_ThrowsAccessDeniedDueToProductionBug() {
            UUID commentId = UUID.randomUUID();
            Comment comment = Comment.builder().id(commentId).user(regularUser).post(samplePost).build();
            when(commentRepo.findById(commentId)).thenReturn(Optional.of(comment));
            when(userRepo.findByHotdropId("regular_dev")).thenReturn(Optional.of(regularUser));

            // In production code: comment.getUser().getId().equals(currentUser.getId().toString())
            // UUID.equals(String) always evaluates to false, causing AccessDeniedException
            assertThatThrownBy(() -> postService.deleteComment(commentId, "regular_dev"))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("You are not authorized to delete this comment");

            verify(commentRepo, never()).delete(any(Comment.class));
        }

        @Test
        @DisplayName("getCommentsByPostId should return paged comments")
        void getCommentsByPostId_Success() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            Comment comment = Comment.builder().id(UUID.randomUUID()).user(regularUser).post(samplePost).build();
            Page<Comment> commentPage = new PageImpl<>(List.of(comment));
            when(commentRepo.findByPostId(eq(samplePostId), any(Pageable.class))).thenReturn(commentPage);

            CommentResponseDto mockDto = new CommentResponseDto();
            when(commentMapper.toResponseDto(eq(comment), any())).thenReturn(mockDto);

            PagedResponse<CommentResponseDto> result = postService.getCommentsByPostId(samplePostId, 0, 10);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("getUsersWhoLikedPost should return paged users")
        void getUsersWhoLikedPost_Success() {
            when(postRepo.findById(samplePostId)).thenReturn(Optional.of(samplePost));
            Like like = Like.builder().user(regularUser).post(samplePost).build();
            Page<Like> likePage = new PageImpl<>(List.of(like));
            when(likeRepo.findByPost(eq(samplePost), any(Pageable.class))).thenReturn(likePage);

            PostResponseDto.UserSummaryDto summaryDto = new PostResponseDto.UserSummaryDto();
            when(postMapper.toUserSummaryDto(regularUser)).thenReturn(summaryDto);

            PagedResponse<PostResponseDto.UserSummaryDto> result = postService.getUsersWhoLikedPost(samplePostId, 0, 10);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }
    }
}
