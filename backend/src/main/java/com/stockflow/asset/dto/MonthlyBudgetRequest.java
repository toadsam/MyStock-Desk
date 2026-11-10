package com.stockflow.asset.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthlyBudgetRequest(
        YearMonth budgetMonth,
        @PositiveOrZero(message = "수입은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "수입은 100억 원 이하로 입력해 주세요.") BigDecimal incomeAmount,
        @PositiveOrZero(message = "생활비 예산은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "생활비 예산은 100억 원 이하로 입력해 주세요.") BigDecimal livingBudgetAmount,
        @PositiveOrZero(message = "고정 지출은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "고정 지출은 100억 원 이하로 입력해 주세요.") BigDecimal fixedExpenseAmount,
        @PositiveOrZero(message = "저축 계획은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "저축 계획은 100억 원 이하로 입력해 주세요.") BigDecimal plannedSavingAmount,
        @PositiveOrZero(message = "투자 계획은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "투자 계획은 100억 원 이하로 입력해 주세요.") BigDecimal plannedInvestmentAmount
) {
}
