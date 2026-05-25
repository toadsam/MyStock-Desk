package com.stockflow.portfolio.dto;

import com.stockflow.global.type.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionDto(
        Long id,
        String stockName,
        String symbol,
        TransactionType transactionType,
        BigDecimal price,
        Integer quantity,
        BigDecimal amount,
        BigDecimal realizedProfitLoss,
        LocalDateTime createdAt
) {
}
