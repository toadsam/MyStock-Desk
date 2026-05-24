package com.stockflow.research.dto;

import com.stockflow.market.dto.MarketIndexDto;
import java.time.LocalDateTime;
import java.util.List;

public record ResearchBriefingDto(
        String greeting,
        String summary,
        LocalDateTime basedAt,
        List<MarketIndexDto> snapshots,
        List<String> keyPoints,
        List<AiInsightDto> insights
) {
}
