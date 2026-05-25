package com.stockflow.theme.dto;

import java.math.BigDecimal;
import java.util.List;

public record RelatedThemeStockDto(
        String symbol,
        String stockName,
        String market,
        String stageId,
        String stageName,
        BigDecimal currentPrice,
        String relationLevel,
        String relationReason,
        List<String> checkMetrics,
        List<String> risks,
        List<String> tags,
        int relationScore,
        int evidenceCount,
        List<String> scoreFactors,
        List<ThemeNewsItemDto> evidenceNews,
        ThemeAiExplanationDto aiExplanation
) {
}
