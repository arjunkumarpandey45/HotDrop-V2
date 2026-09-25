package com.arjun.hotdrop_backend.mapper;

import com.arjun.hotdrop_backend.error.ApiErrorResponseDto;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ErrorMapper {

    public ApiErrorResponseDto toApiErrorResponseDto(int status, String error, String message, String path, String requestId) {
        return ApiErrorResponseDto.builder()
                .status(status)
                .error(error)
                .message(message)
                .timestamp(LocalDateTime.now())
                .path(path)
                .requestId(requestId)
                .build();
    }
}
