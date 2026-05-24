package com.stockflow.market.dto;

import java.math.BigDecimal;

public record HeatmapStockDto(
        String symbol,
        String name,
        BigDecimal changeRate,
        BigDecimal marketCap
) {
}
