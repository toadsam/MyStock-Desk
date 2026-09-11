package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 문자나 캡처에서 읽어낸 소비 후보 한 건.
 * 저장되지 않은 상태이며, 사용자가 확인 화면에서 확정해야 Expense 가 된다.
 */
public record ParsedExpenseDto(
        String category,
        String merchant,
        BigDecimal amount,
        LocalDate spentDate,
        String source,
        String rawText,
        boolean duplicate,
        String warning
) {
    public ParsedExpenseDto withDuplicate(boolean duplicated) {
        return new ParsedExpenseDto(
                category,
                merchant,
                amount,
                spentDate,
                source,
                rawText,
                duplicated,
                duplicated ? "같은 가게·금액·날짜의 기록이 이미 있습니다." : warning
        );
    }
}
