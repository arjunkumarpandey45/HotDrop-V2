
package com.arjun.hotdrop_backend.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponseDto {
    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private String requestId;
    private Map<String, String> validationErrors;
    private String path;
}