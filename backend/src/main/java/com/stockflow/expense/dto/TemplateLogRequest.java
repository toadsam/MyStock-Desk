package com.stockflow.expense.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 퀵버튼 한 번 누르기. 둘 다 비워 보내면 버튼에 저장된 금액으로 오늘 날짜에 기록한다.
 */
public record TemplateLogRequest(
        @DecimalMax(value = Limits.EXPENSE_MAX, message = "금액은 1억 원 이하로 입력해 주세요.") BigDecimal amount,
        LocalDate spentDate
) {
}
