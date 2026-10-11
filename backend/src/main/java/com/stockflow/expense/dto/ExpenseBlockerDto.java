package com.stockflow.expense.dto;

import java.math.BigDecimal;

/**
 * 이번 달 소비가 큰 카테고리 하나.
 *
 * @param ratio 이번 달 전체 소비에서 이 카테고리가 차지하는 비율(%).
 *              예전에는 ratio ÷ 10 에 음수를 붙인 값을 "목표 달성률 영향"이라고 내보냈다. 근거가 없어 뺐다.
 */
public record ExpenseBlockerDto(
        int rank,
        String category,
        BigDecimal amount,
        long count,
        BigDecimal ratio
) {
}
