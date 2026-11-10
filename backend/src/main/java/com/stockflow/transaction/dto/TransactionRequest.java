package com.stockflow.transaction.dto;

import com.stockflow.global.type.TransactionType;
import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** 미래 날짜인지는 서비스가 본다. CSV 로 올린 기록도 같은 길을 지나게 하려고다. */
public record TransactionRequest(
        @Size(max = 20) String symbol,
        @Size(max = 60) String stockName,
        @NotNull TransactionType transactionType,
        @PositiveOrZero @Max(value = 100000000, message = "수량은 1억 주 이하로 입력해 주세요.") Integer quantity,
        @NotNull @PositiveOrZero
        @DecimalMax(value = Limits.PLAN_MAX, message = "단가는 100억 원 이하로 입력해 주세요.") BigDecimal price,
        @PositiveOrZero
        @DecimalMax(value = Limits.PLAN_MAX, message = "수수료는 100억 원 이하로 입력해 주세요.") BigDecimal fee,
        @PositiveOrZero
        @DecimalMax(value = Limits.PLAN_MAX, message = "세금은 100억 원 이하로 입력해 주세요.") BigDecimal tax,
        @NotNull LocalDate transactionDate,
        @Size(max = 500, message = "메모는 500자 이내로 적어 주세요.") String memo,
        @Size(max = 500, message = "이유는 500자 이내로 적어 주세요.") String reason,
        @Size(max = 20) List<@Size(max = 30) String> tags
) {
}
