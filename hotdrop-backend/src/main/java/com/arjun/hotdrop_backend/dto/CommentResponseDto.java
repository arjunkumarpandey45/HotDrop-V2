package com.arjun.hotdrop_backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDto {
    private UUID id;
    private String text;
    private LocalDateTime createdAt;
    private PostResponseDto.UserSummaryDto user; 
}