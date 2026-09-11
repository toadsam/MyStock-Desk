package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 돈 흐름 목록의 한 줄. 소비와 투자 매수를 같은 화면에 섞어 보여주기 위한 표현이다.
 *
 * <p>moneyKept 가 핵심이다. 소비는 사라진 돈(false), 투자는 형태만 바뀐 내 돈(true)이다.
 * 화면에서 이 값으로 채운 막대와 빈 막대를 가른다.
 */
public record CashFlowItemDto(
        String kind,
        Long refId,
        String category,
        String title,
        BigDecimal amount,
        LocalDate date,
        boolean moneyKept
) {
}
