package com.stockflow.expense.dto;

import java.math.BigDecimal;

/** 가게 이름 자동완성 후보. 과거 기록에서 최빈 카테고리와 최빈 금액을 뽑는다. */
public record MerchantSuggestionDto(
        String merchant,
        String category,
        BigDecimal suggestedAmount,
        long usageCount
) {
}
