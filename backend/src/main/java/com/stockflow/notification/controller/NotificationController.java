package com.stockflow.notification.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.notification.dto.NotificationDto;
import com.stockflow.notification.dto.NotificationSummaryDto;
import com.stockflow.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationSummaryDto> notifications(@RequestParam(required = false) String category) {
        return ApiResponse.success(notificationService.getNotifications(category));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationDto> read(@PathVariable Long id) {
        return ApiResponse.success(notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> readAll() {
        notificationService.markAllRead();
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ApiResponse.success();
    }

    @DeleteMapping("/read")
    public ApiResponse<Void> deleteRead() {
        notificationService.deleteRead();
        return ApiResponse.success();
    }
}
