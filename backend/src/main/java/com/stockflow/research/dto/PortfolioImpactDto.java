package com.stockflow.research.dto;

import java.math.BigDecimal;

public record PortfolioImpactDto(
        String title,
        String relatedStockSymbol,
        BigDecimal expectedImpact,
        String impactLabel
) {
}
