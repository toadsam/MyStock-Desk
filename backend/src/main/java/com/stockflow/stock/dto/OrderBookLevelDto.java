package com.stockflow.stock.dto;

import java.math.BigDecimal;

public record OrderBookLevelDto(
        BigDecimal price,
        Long quantity,
        BigDecimal changeRate
) {
}
