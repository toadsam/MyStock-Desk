package com.stockflow.theme.dto;

import java.time.LocalDateTime;

public record ThemeNewsItemDto(
        String title,
        String source,
        String url,
        LocalDateTime publishedAt
) {
}
