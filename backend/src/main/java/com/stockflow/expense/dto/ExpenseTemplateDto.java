package com.stockflow.expense.dto;

import com.stockflow.expense.entity.ExpenseTemplate;
import java.math.BigDecimal;

/** 지출 화면 상단의 퀵버튼 하나. */
public record ExpenseTemplateDto(
        Long id,
        String name,
        String category,
        String merchant,
        BigDecimal amount,
        int usageCount
) {
    public static ExpenseTemplateDto from(ExpenseTemplate template) {
        return new ExpenseTemplateDto(
                template.getId(),
                template.getName(),
                template.getCategory(),
                template.getMerchant(),
                template.getAmount(),
                template.getUsageCount()
        );
    }
}
