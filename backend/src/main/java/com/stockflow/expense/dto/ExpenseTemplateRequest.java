package com.stockflow.expense.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ExpenseTemplateRequest(
        @NotBlank @Size(max = 30, message = "버튼 이름은 30자 이내로 적어 주세요.") String name,
        @NotBlank @Size(max = 30, message = "카테고리는 30자 이내로 적어 주세요.") String category,
        @NotBlank @Size(max = 100, message = "사용처는 100자 이내로 적어 주세요.") String merchant,
        @NotNull @Positive(message = "금액은 0원보다 커야 해요.")
        @DecimalMax(value = Limits.EXPENSE_MAX, message = "금액은 1억 원 이하로 입력해 주세요.") BigDecimal amount
) {
}
