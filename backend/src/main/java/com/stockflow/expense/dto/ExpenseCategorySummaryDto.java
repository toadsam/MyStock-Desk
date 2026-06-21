package com.stockflow.expense.dto;

import java.math.BigDecimal;

public record ExpenseCategorySummaryDto(
        String category,
        BigDecimal amount,
        BigDecimal ratio,
        long count,
        BigDecimal averageAmount
) {
}
