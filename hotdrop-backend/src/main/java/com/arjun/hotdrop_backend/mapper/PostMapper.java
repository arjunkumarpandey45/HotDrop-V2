package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.PostResponseDto;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.PostImage;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PostMapper {

    public PostResponseDto toResponseDto(Post post) {
        return toResponseDto(post, false, null);
    }

    public PostResponseDto toResponseDto(Post post, boolean isLiked, PostResponseDto.UserSummaryDto creator) {
        if (post == null) return null;

        List<String> imageUrls = new ArrayList<>();
        if (post.getImages() != null) {
            for (PostImage image : post.getImages()) {
                imageUrls.add(image.getUrl());
            }
        }

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

    public PostResponseDto.UserSummaryDto toUserSummaryDto(User user) {
        if (user == null) return null;
        return PostResponseDto.UserSummaryDto.builder()
                .id(user.getId())
                .hotdropId(user.getHotdropId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePicture(user.getProfileImageUrl())
                .build();
    }

    public com.arjun.hotdrop_backend.dto.LinkVerificationResponseDto toLinkVerificationResponseDto(boolean isLive, String url, String message, List<String> detectedTags) {
        return com.arjun.hotdrop_backend.dto.LinkVerificationResponseDto.builder()
                .isLive(isLive)
                .url(url)
                .message(message)
                .detectedTags(detectedTags == null ? java.util.Collections.emptyList() : detectedTags)
                .build();
    }

    public com.arjun.hotdrop_backend.dto.PostListResponseDto toPostListResponseDto(List<PostResponseDto> posts, int pageNumber, int pageSize, long totalElements, int totalPages, boolean isLastPage) {
        return com.arjun.hotdrop_backend.dto.PostListResponseDto.builder()
                .posts(posts)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .isLastPage(isLastPage)
                .build();
    }
}