package com.stockflow.asset.dto;

import com.stockflow.asset.entity.MonthlyBudget;
import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthlyBudgetDto(
        YearMonth budgetMonth,
        BigDecimal incomeAmount,
        BigDecimal livingBudgetAmount,
        BigDecimal fixedExpenseAmount,
        BigDecimal plannedSavingAmount,
        BigDecimal plannedInvestmentAmount
) {
    public static MonthlyBudgetDto from(MonthlyBudget budget) {
        return new MonthlyBudgetDto(
                budget.getBudgetMonth(),
                budget.getIncomeAmount(),
                budget.getLivingBudgetAmount(),
                budget.getFixedExpenseAmount(),
                budget.getPlannedSavingAmount(),
                budget.getPlannedInvestmentAmount()
        );
    }
}
