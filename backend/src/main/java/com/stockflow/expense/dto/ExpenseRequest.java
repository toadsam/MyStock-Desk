package com.stockflow.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotBlank String category,
        @NotBlank String merchant,
        @NotNull @Positive BigDecimal amount,
        @NotNull LocalDate spentDate,
        String memo
) {
}
