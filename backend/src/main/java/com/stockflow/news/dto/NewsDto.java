package com.stockflow.news.dto;

import com.stockflow.global.type.ImpactType;
import com.stockflow.news.entity.News;
import java.time.LocalDateTime;

public record NewsDto(
        Long id,
        String title,
        String summary,
        String category,
        String source,
        ImpactType impactType,
        String relatedStockSymbol,
        LocalDateTime publishedAt,
        Integer aiImportanceScore
) {
    public static NewsDto from(News news) {
        return new NewsDto(
                news.getId(),
                news.getTitle(),
                news.getSummary(),
                news.getCategory(),
                news.getSource(),
                news.getImpactType(),
                news.getRelatedStockSymbol(),
                news.getPublishedAt(),
                news.getAiImportanceScore()
        );
    }
}
