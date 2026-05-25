package com.stockflow.marketdata.dto;

import java.math.BigDecimal;

public record StockQuoteSnapshot(
        String symbol,
        BigDecimal currentPrice,
        BigDecimal highPrice,
        BigDecimal lowPrice,
        Long volume,
        BigDecimal tradingValue
) {
}
