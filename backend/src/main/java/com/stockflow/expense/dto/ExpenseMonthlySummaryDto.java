package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

public record ExpenseMonthlySummaryDto(
        YearMonth month,
        BigDecimal totalAmount,
        BigDecimal previousMonthAmount,
        BigDecimal changeRate,
        BigDecimal dailyAverageAmount,
        List<ExpenseCategorySummaryDto> categories,
        List<ExpenseBlockerDto> goalBlockers,
        List<ExpenseTrendDto> trends
) {
}
