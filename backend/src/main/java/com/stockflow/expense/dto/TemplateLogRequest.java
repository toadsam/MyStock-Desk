package com.stockflow.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 퀵버튼 한 번 누르기. 둘 다 비워 보내면 버튼에 저장된 금액으로 오늘 날짜에 기록한다.
 */
public record TemplateLogRequest(
        BigDecimal amount,
        LocalDate spentDate
) {
}
