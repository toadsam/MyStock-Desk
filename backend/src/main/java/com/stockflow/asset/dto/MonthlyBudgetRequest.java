package com.stockflow.asset.dto;

import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthlyBudgetRequest(
        YearMonth budgetMonth,
        BigDecimal incomeAmount,
        BigDecimal livingBudgetAmount,
        BigDecimal fixedExpenseAmount,
        BigDecimal plannedSavingAmount,
        BigDecimal plannedInvestmentAmount
) {
}
