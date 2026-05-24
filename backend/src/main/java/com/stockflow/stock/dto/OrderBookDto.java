package com.stockflow.stock.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderBookDto(
        String symbol,
        BigDecimal currentPrice,
        List<OrderBookLevelDto> asks,
        List<OrderBookLevelDto> bids,
        BigDecimal executionStrength
) {
}
