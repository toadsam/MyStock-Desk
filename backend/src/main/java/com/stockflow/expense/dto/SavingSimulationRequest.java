package com.stockflow.expense.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.Map;

/** 줄이는 비율은 퍼센트다. 20 이면 그 카테고리를 20% 덜 쓴다는 뜻이고, 100 을 넘으면 쓴 돈보다 많이 아끼는 셈이라 받지 않는다. */
public record SavingSimulationRequest(
        @Size(max = 30) Map<String,
                @NotNull(message = "줄일 비율을 숫자로 넣어 주세요.")
                @DecimalMin(value = "0", message = "줄일 비율은 0% 이상이어야 해요.")
                @DecimalMax(value = "100", message = "줄일 비율은 100% 이하여야 해요.") BigDecimal> categoryReductionRates,
        @PositiveOrZero(message = "추가로 모을 금액은 0원 이상이어야 해요.")
        @DecimalMax(value = Limits.PLAN_MAX, message = "추가로 모을 금액은 100억 원 이하로 입력해 주세요.") BigDecimal fixedSavingAmount
) {
}
