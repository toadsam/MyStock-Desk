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
        String sourceUrl,
        String dataProvider,
        LocalDateTime fetchedAt,
        String reliability,
        Boolean officialSource,
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
                news.getSourceUrl(),
                news.getDataProvider() == null ? "seed" : news.getDataProvider(),
                news.getFetchedAt() == null ? news.getPublishedAt() : news.getFetchedAt(),
                news.getReliability() == null ? "DEMO" : news.getReliability(),
                Boolean.TRUE.equals(news.getOfficialSource()),
                news.getImpactType(),
                news.getRelatedStockSymbol(),
                news.getPublishedAt(),
                news.getAiImportanceScore()
        );
    }
}
