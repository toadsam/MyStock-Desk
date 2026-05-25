package com.stockflow.portfolio.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PortfolioStudyCandidateDto(
        String candidateSymbol,
        String candidateName,
        String category,
        String relationType,
        String studyReason,
        List<String> checkPoints,
        List<String> relatedHoldings,
        int relevanceScore,
        String riskNote,
        String dataSource,
        LocalDateTime lastUpdatedAt
) {
}
