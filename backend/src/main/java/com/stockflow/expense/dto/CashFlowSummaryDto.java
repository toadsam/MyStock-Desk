package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * 이번 달 돈 흐름. 소비와 투자를 한 목록으로 보여주되 합계는 끝까지 분리한다.
 *
 * <p>spentTotal 에는 투자금이 절대 들어가지 않는다. 섞이면 저축률과 남은 생활비가
 * 모두 틀어지고, 투자를 잘하고 있는 사용자가 낭비했다고 오해하게 된다.
 */
public record CashFlowSummaryDto(
        YearMonth month,
        BigDecimal incomeAmount,
        BigDecimal spentTotal,
        BigDecimal investedTotal,
        BigDecimal savedTotal,
        BigDecimal keptTotal,
        BigDecimal remainingAmount,
        List<CashFlowItemDto> items
) {
}
