package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.PostResponseDto;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.PostImage;
import com.arjun.hotdrop_backend.repository.LikeRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
@Component
@RequiredArgsConstructor
public class PostMapperWithID {

    private final LikeRepo likeRepo;
    private final UserRepo userRepo;

    public PostResponseDto toResponseDto(Post post, String currentHotdropId) {

        boolean isLiked = false;
        if (currentHotdropId != null) {
            isLiked = likeRepo.existsByUserAndPost(
                    userRepo.findByHotdropId(currentHotdropId).orElse(null), post);
        }

        List<String> imageUrls = post.getImages().stream()
                .map(PostImage::getUrl)
                .toList();

        PostResponseDto.UserSummaryDto creator = PostResponseDto.UserSummaryDto.builder()
                .id(post.getUser().getId())
                .hotdropId(post.getUser().getHotdropId())
                .profilePicture(post.getUser().getProfileImageUrl())
                .build();

        return PostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .projectUrl(post.getProjectUrl())
                .shareUrl(post.getShareUrl())
                .isLiked(isLiked)
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .tags(post.getTags())
                .imageUrls(imageUrls)
                .isLinkDead(post.isLinkDead())
                .creator(creator)
                .build();
    }
}