package com.stockflow.upload.dto;

import java.time.LocalDateTime;

public record ScreenshotGalleryItemDto(
        String originalFileName,
        String storedFileName,
        String fileUrl,
        String fileType,
        LocalDateTime uploadedAt
) {
}
