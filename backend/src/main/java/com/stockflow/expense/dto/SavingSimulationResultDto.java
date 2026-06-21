package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SavingSimulationResultDto(
        BigDecimal currentGoalRate,
        BigDecimal expectedGoalRate,
        BigDecimal monthlySavingAmount,
        Map<String, BigDecimal> categorySavings
) {
}
