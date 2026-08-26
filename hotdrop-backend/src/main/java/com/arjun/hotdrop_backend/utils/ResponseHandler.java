package com.arjun.hotdrop_backend.utils;

import com.arjun.hotdrop_backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseHandler {

    public static <T> ResponseEntity<ApiResponse<T>> generateResponse(HttpStatus status, String message, T responseObj) {
        ApiResponse<T> apiResponse = ApiResponse.<T>builder()
                .statusCode(status.value())
                .message(message)
                .data(responseObj)
                .error(null)
                .build();

        return new ResponseEntity<>(apiResponse, status);
    }

    public static ResponseEntity<ApiResponse<Void>> generateResponse(HttpStatus status, String message) {
        return generateResponse(status, message, null);
    }

    public static ResponseEntity<ApiResponse<Object>> generateErrorResponse(HttpStatus status, String message, String errorDetails) {
        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .statusCode(status.value())
                .message(message)
                .data(null)
                .error(errorDetails)
                .build();

        return new ResponseEntity<>(apiResponse, status);
    }
}