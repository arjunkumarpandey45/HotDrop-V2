package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.dto.CommentResponseDto;
import com.arjun.hotdrop_backend.dto.PostResponseDto;
import com.arjun.hotdrop_backend.entity.Comment;
import com.arjun.hotdrop_backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {

    public CommentResponseDto toResponseDto(Comment comment, PostResponseDto.UserSummaryDto userSummary) {
        if (comment == null) return null;
        
        return CommentResponseDto.builder()
                .id(comment.getId())
                .text(comment.getText())
                .createdAt(comment.getCreatedAt())
                .user(userSummary)
                .build();
    }
}
