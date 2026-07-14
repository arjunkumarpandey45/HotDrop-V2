package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.PostResponseDto;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.PostImage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PostMapper {

    public PostResponseDto toResponseDto(Post post) {

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