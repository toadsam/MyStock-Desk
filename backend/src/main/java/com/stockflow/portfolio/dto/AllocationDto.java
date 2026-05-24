package com.stockflow.portfolio.dto;

import java.math.BigDecimal;

public record AllocationDto(
        String name,
        BigDecimal value,
        BigDecimal rate
) {
}
