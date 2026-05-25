package com.stockflow.theme.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ThemeDiscoveryDto(
        String id,
        String keyword,
        String title,
        String sourceCompany,
        String summary,
        ThemeCatalystDto catalyst,
        List<SupplyChainStageDto> stages,
        List<RelatedThemeStockDto> relatedStocks,
        List<String> beginnerSummary,
        List<String> aiCheckpoints,
        List<String> riskNotes,
        List<String> repeatedKeywords,
        List<ThemeNewsItemDto> liveNews,
        LocalDateTime updatedAt
) {
}
