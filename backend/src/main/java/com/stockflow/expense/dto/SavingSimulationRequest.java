package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SavingSimulationRequest(
        Map<String, BigDecimal> categoryReductionRates,
        BigDecimal fixedSavingAmount
) {
}
