package com.stockflow.research.dto;

import com.stockflow.global.type.InsightType;
import com.stockflow.global.type.Sentiment;
import com.stockflow.research.entity.AiInsight;
import java.time.LocalDateTime;

public record AiInsightDto(
        Long id,
        InsightType type,
        String title,
        String content,
        Sentiment sentiment,
        Integer score,
        LocalDateTime createdAt
) {
    public static AiInsightDto from(AiInsight insight) {
        return new AiInsightDto(
                insight.getId(),
                insight.getType(),
                insight.getTitle(),
                insight.getContent(),
                insight.getSentiment(),
                insight.getScore(),
                insight.getCreatedAt()
        );
    }
}
