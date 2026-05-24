package com.stockflow.research.dto;

import java.math.BigDecimal;

public record RecommendationDto(
        String symbol,
        String name,
        BigDecimal targetPrice,
        BigDecimal upside,
        String reason
) {
}
