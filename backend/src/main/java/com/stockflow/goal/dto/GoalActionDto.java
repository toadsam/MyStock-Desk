package com.stockflow.goal.dto;

import java.math.BigDecimal;

public record GoalActionDto(
        String title,
        String description,
        BigDecimal monthlySavingAmount,
        String category,
        Integer impactScore
) {
}
