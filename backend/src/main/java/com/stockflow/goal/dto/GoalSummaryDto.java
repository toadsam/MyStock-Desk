package com.stockflow.goal.dto;

import java.math.BigDecimal;

public record GoalSummaryDto(
        long activeGoalCount,
        BigDecimal averageProgressRate,
        BigDecimal monthlyTargetSavingAmount,
        BigDecimal totalRemainingAmount,
        SavingGoalDto mainGoal
) {
}
