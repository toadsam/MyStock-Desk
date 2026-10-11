package com.stockflow.expense.dto;

import java.math.BigDecimal;

/** 한 달의 소비와 그 달 생활비 예산. 예산을 정하지 않은 달은 0 이다. */
public record ExpenseTrendDto(
        String month,
        BigDecimal amount,
        BigDecimal budget
) {
}
