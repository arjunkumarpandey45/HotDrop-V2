
package com.arjun.hotdrop_backend.error;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApiErrorResponseDto {
    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private String path;
}