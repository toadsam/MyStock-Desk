package com.stockflow.goal.dto;

import com.stockflow.goal.entity.SavingGoal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public record SavingGoalDto(
        Long id,
        String title,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal remainingAmount,
        BigDecimal progressRate,
        LocalDate targetDate,
        Long remainingDays,
        BigDecimal dailyRequiredAmount,
        String status,
        Integer priority,
        List<GoalActionDto> recommendedActions
) {
    public static SavingGoalDto of(SavingGoal goal, List<GoalActionDto> actions) {
        BigDecimal current = money(goal.getCurrentAmount());
        BigDecimal target = money(goal.getTargetAmount());
        BigDecimal remaining = target.subtract(current).max(BigDecimal.ZERO);
        long days = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate()));
        BigDecimal progress = target.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : current.multiply(BigDecimal.valueOf(100)).divide(target, 1, RoundingMode.HALF_UP);
        BigDecimal daily = days == 0
                ? remaining
                : remaining.divide(BigDecimal.valueOf(days), 0, RoundingMode.CEILING);
        return new SavingGoalDto(
                goal.getId(),
                goal.getTitle(),
                target,
                current,
                remaining,
                progress.min(BigDecimal.valueOf(100)),
                goal.getTargetDate(),
                days,
                daily,
                goal.getStatus(),
                goal.getPriority(),
                actions
        );
    }

    private static BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
