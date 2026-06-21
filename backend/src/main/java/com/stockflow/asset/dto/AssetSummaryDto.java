package com.stockflow.asset.dto;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

public record AssetSummaryDto(
        YearMonth month,
        BigDecimal totalAsset,
        BigDecimal accountBalance,
        BigDecimal investmentAsset,
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpense,
        BigDecimal remainingLivingBudget,
        BigDecimal investmentAvailableAmount,
        BigDecimal savingRate,
        List<FinancialAccountDto> accounts,
        MonthlyBudgetDto budget
) {
}
