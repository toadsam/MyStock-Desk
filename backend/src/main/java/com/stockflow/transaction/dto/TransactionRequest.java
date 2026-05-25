package com.stockflow.transaction.dto;

import com.stockflow.global.type.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TransactionRequest(
        String symbol,
        String stockName,
        @NotNull TransactionType transactionType,
        @PositiveOrZero Integer quantity,
        @NotNull @PositiveOrZero BigDecimal price,
        @PositiveOrZero BigDecimal fee,
        @PositiveOrZero BigDecimal tax,
        @NotNull LocalDate transactionDate,
        String memo,
        String reason,
        List<String> tags
) {
}
