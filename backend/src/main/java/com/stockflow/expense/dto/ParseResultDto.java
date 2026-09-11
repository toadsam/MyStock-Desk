package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * 붙여넣기·캡처 한 번의 결과. 저장 전 후보 목록이다.
 *
 * <p>reportedTotal 은 캡처 화면에 적혀 있던 합계이고, totalMatched 가 false 면
 * 금액 자릿수를 잘못 읽었을 가능성이 있으므로 확인 화면에서 경고해야 한다.
 */
public record ParseResultDto(
        List<ParsedExpenseDto> items,
        int parsedCount,
        int duplicateCount,
        BigDecimal totalAmount,
        BigDecimal reportedTotal,
        boolean totalMatched,
        List<String> warnings
) {
}
