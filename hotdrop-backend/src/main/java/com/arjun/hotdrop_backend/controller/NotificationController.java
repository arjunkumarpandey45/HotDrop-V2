package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.ApiResponse;
import com.arjun.hotdrop_backend.dto.NotificationResponseDto;
import com.arjun.hotdrop_backend.service.NotificationService;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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
            log.error("Cannot get notifications: user is not logged in.");
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        log.info("Getting notifications for user: {}, page: {}, size: {}", userDetails.getUsername(), page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponseDto> notifications = notificationService.getUserNotifications(userDetails.getUsername(), pageable);
        log.info("Loaded {} notifications for user: {}", notifications.getNumberOfElements(), userDetails.getUsername());

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
            log.error("Cannot get unread count: user is not logged in.");
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        log.info("Checking unread notifications for user: {}", userDetails.getUsername());
        long unreadCount = notificationService.getUnreadCount(userDetails.getUsername());
        log.info("User {} has {} unread notifications.", userDetails.getUsername(), unreadCount);

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
            log.error("Cannot mark notification {} as read: user is not logged in.", id);
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        log.info("Marking notification {} as read for user: {}", id, userDetails.getUsername());
        notificationService.markAsRead(id, userDetails.getUsername());
        log.info("Marked notification {} as read for user: {}", id, userDetails.getUsername());

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
            log.error("Cannot mark notifications as read: user is not logged in.");
            return ResponseHandler.generateResponse(HttpStatus.UNAUTHORIZED, "Authentication required", null);
        }

        log.info("Marking all notifications as read for user: {}", userDetails.getUsername());
        notificationService.markAllAsRead(userDetails.getUsername());
        log.info("Marked all notifications as read for user: {}", userDetails.getUsername());

        return ResponseHandler.generateResponse(
                HttpStatus.OK,
                "All notifications marked as read",
                null
        );
    }
}