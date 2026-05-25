package com.stockflow.upload.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.upload.dto.ScreenshotGalleryItemDto;
import com.stockflow.upload.dto.ScreenshotUploadDto;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final List<ScreenshotGalleryItemDto> SCREENSHOTS = new ArrayList<>();

    @GetMapping("/screenshots")
    public ApiResponse<List<ScreenshotGalleryItemDto>> screenshots() {
        return ApiResponse.success(SCREENSHOTS.stream()
                .sorted(Comparator.comparing(ScreenshotGalleryItemDto::uploadedAt).reversed())
                .toList());
    }

    @PostMapping("/screenshots")
    public ApiResponse<ScreenshotUploadDto> screenshot(@RequestParam("file") MultipartFile file) throws IOException {
        Path uploadDir = Path.of(System.getProperty("java.io.tmpdir"), "stockflow-uploads");
        Files.createDirectories(uploadDir);
        String storedName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path target = uploadDir.resolve(storedName);
        file.transferTo(target);
        ScreenshotUploadDto uploaded = new ScreenshotUploadDto(
                file.getOriginalFilename(),
                storedName,
                target.toUri().toString(),
                file.getContentType(),
                LocalDateTime.now()
        );
        SCREENSHOTS.add(new ScreenshotGalleryItemDto(
                uploaded.originalFileName(),
                uploaded.storedFileName(),
                uploaded.fileUrl(),
                uploaded.fileType(),
                uploaded.uploadedAt()
        ));
        return ApiResponse.success(uploaded);
    }
}
