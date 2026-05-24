package com.stockflow.portfolio.dto;

import java.math.BigDecimal;

public record PerformancePointDto(
        String label,
        BigDecimal portfolioValue,
        BigDecimal kospiValue
) {
}
