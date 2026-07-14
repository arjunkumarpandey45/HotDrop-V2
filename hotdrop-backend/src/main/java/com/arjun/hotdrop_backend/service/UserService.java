package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.PostResponseDto;
import com.arjun.hotdrop_backend.dto.UserResponseOnSearchDto;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.PostImage;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final PostRepo postRepo;
    private final UserRepo userRepo;

    public UserResponseOnSearchDto getUserByHotDropId(String hotdropId) {

        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("Search failed: HotdropId '{}' does not exist in database", hotdropId);
                    return new RuntimeException("User profile not found with ID: " + hotdropId);
                });
        List<PostResponseDto> userPosts = new ArrayList<>();

        if (currentUser.getRoles() != null) {

            List<Post> allPosts = postRepo.findByUserId(currentUser.getId());

            for (Post post : allPosts) {

                if (post.getUser().getId().equals(currentUser.getId())) {

                    PostResponseDto postDto = mapToPostResponseDto(post);

                    userPosts.add(postDto);
                }
            }
        }
        return UserResponseOnSearchDto.builder()
                .firstName(currentUser.getFirstName())
                .lastName(currentUser.getLastName())
                .hotdropId(currentUser.getHotdropId())
                .id(currentUser.getId())
                .email(currentUser.getEmail())
                .bio(currentUser.getBio())
                .portfolioUrl(currentUser.getPortfolioUrl())
                .profileImageUrl(currentUser.getProfileImageUrl())
                .linkedinUrl(currentUser.getLinkedinUrl())
                .githubUrl(currentUser.getGithubUrl())
                .leetcodeUrl(currentUser.getLeetcodeUrl()).posts(userPosts).build();

    }
    public PostResponseDto mapToPostResponseDto(Post post){
        List<String> imageUrls = new ArrayList<>();

        for (PostImage image : post.getImages()) {
            imageUrls.add(image.getUrl());
        }
        return PostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .projectUrl(post.getProjectUrl())
                .shareUrl(post.getShareUrl())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .tags(post.getTags())
                .imageUrls(imageUrls)
                .isLinkDead(post.isLinkDead())
                .build();
    }
}
