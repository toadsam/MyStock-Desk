package com.stockflow.expense.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/** 미래 날짜인지는 서비스가 한국 날짜 기준으로 본다. */
public record ExpenseRequest(
        @NotBlank @Size(max = 30, message = "카테고리는 30자 이내로 적어 주세요.") String category,
        @NotBlank @Size(max = 100, message = "사용처는 100자 이내로 적어 주세요.") String merchant,
        @NotNull @Positive(message = "금액은 0원보다 커야 해요.")
        @DecimalMax(value = Limits.EXPENSE_MAX, message = "금액은 1억 원 이하로 입력해 주세요.") BigDecimal amount,
        @NotNull LocalDate spentDate,
        @Size(max = 200, message = "메모는 200자 이내로 적어 주세요.") String memo
) {
}
