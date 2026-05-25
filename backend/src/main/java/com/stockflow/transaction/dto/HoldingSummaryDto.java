package com.stockflow.transaction.dto;

import java.math.BigDecimal;

public record HoldingSummaryDto(
        String symbol,
        String stockName,
        Integer quantity,
        BigDecimal averagePrice,
        BigDecimal currentPrice,
        BigDecimal evaluationAmount,
        BigDecimal profitLoss,
        BigDecimal returnRate,
        BigDecimal realizedProfitLoss,
        BigDecimal weight
) {
}
