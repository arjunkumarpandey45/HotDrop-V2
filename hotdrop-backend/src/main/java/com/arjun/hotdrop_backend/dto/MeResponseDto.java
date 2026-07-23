package com.arjun.hotdrop_backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponseDto {
    private UserResponseDto user;

    private List<PostResponseDto> posts;
}