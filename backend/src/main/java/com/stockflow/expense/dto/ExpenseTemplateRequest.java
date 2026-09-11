package com.stockflow.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record ExpenseTemplateRequest(
        @NotBlank String name,
        @NotBlank String category,
        @NotBlank String merchant,
        @NotNull @Positive BigDecimal amount
) {
}
