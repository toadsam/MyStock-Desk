package com.stockflow.expense.dto;

import java.math.BigDecimal;

public record ExpenseTrendDto(
        String month,
        BigDecimal amount,
        BigDecimal budget,
        BigDecimal goalImpactAmount
) {
}
