package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.ApiResponse;
import com.arjun.hotdrop_backend.dto.NotificationResponseDto;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponseDto>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponseDto> notifications = notificationService.getUserNotifications(userDetails.getUsername(), pageable);

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Notifications fetched successfully",
                notifications
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        long unreadCount = notificationService.getUnreadCount(userDetails.getUsername());

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Unread count fetched successfully",
                Map.of("unreadCount", unreadCount)
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        notificationService.markAsRead(id, userDetails.getUsername());

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "Notification marked as read",
                null
        );
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        notificationService.markAllAsRead(userDetails.getUsername());

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "All notifications marked as read",
                null
        );
    }
}