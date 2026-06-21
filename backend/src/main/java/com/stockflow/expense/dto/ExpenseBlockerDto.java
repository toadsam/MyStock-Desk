package com.stockflow.expense.dto;

import java.math.BigDecimal;

public record ExpenseBlockerDto(
        int rank,
        String category,
        BigDecimal amount,
        long count,
        BigDecimal goalImpactRate
) {
}
