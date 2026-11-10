package com.stockflow.goal.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/** 목표 날짜가 지났는지는 서비스가 본다. 이미 지난 목표의 다른 칸을 고치는 건 막지 않아야 해서다. */
public record SavingGoalRequest(
        @NotBlank @Size(max = 60, message = "목표 이름은 60자 이내로 적어 주세요.") String title,
        @NotNull @Positive(message = "목표 금액은 0원보다 커야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "목표 금액은 100억 원 이하로 입력해 주세요.") BigDecimal targetAmount,
        @PositiveOrZero(message = "모은 금액은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "모은 금액은 100억 원 이하로 입력해 주세요.") BigDecimal currentAmount,
        @NotNull LocalDate targetDate,
        @Size(max = 20) String status,
        @Min(value = 1, message = "우선순위는 1 이상이어야 해요.")
        @Max(value = 99, message = "우선순위는 99 이하여야 해요.") Integer priority
) {
}
