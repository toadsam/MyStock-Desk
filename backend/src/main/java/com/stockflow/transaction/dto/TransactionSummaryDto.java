package com.stockflow.transaction.dto;

import java.math.BigDecimal;

public record TransactionSummaryDto(
        long monthlyTransactionCount,
        BigDecimal totalBuyAmount,
        BigDecimal totalSellAmount,
        BigDecimal realizedProfitLoss,
        BigDecimal totalFee
) {
}
