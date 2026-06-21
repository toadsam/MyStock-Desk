package com.stockflow.notification.dto;

import com.stockflow.notification.entity.Notification;
import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String category,
        String title,
        String body,
        String targetPath,
        String tone,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getCategory(),
                notification.getTitle(),
                notification.getBody(),
                notification.getTargetPath(),
                notification.getTone(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
