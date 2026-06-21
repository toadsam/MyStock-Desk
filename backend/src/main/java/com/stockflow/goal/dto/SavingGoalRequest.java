package com.stockflow.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingGoalRequest(
        @NotBlank String title,
        @NotNull @Positive BigDecimal targetAmount,
        BigDecimal currentAmount,
        @NotNull LocalDate targetDate,
        String status,
        Integer priority
) {
}
