package com.stockflow.research.dto;

import java.math.BigDecimal;
import java.util.List;

public record StudyCandidateDto(
        String symbol,
        String name,
        String category,
        String relationType,
        String studyReason,
        List<String> checkPoints,
        BigDecimal relevanceScore,
        String riskNote,
        String dataSource
) {
}
