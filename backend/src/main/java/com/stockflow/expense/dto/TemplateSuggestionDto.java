package com.stockflow.expense.dto;

import java.math.BigDecimal;

/** "이 가게 자주 가시네요, 버튼으로 만들까요?" 제안 한 건. */
public record TemplateSuggestionDto(
        String merchant,
        String category,
        BigDecimal amount,
        long usageCount,
        String message
) {
}
