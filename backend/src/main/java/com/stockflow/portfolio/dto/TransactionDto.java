package com.stockflow.portfolio.dto;

import com.stockflow.global.type.OrderStatus;
import com.stockflow.global.type.OrderType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionDto(
        Long id,
        String stockName,
        String symbol,
        OrderType orderType,
        BigDecimal price,
        Integer quantity,
        BigDecimal amount,
        OrderStatus status,
        LocalDateTime createdAt
) {
}
