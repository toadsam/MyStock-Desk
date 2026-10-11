package com.stockflow.expense.dto;

import com.stockflow.expense.entity.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseDto(
        Long id,
        String category,
        String merchant,
        BigDecimal amount,
        LocalDate spentDate,
        String memo,
        LocalDateTime createdAt
) {
    public static ExpenseDto from(Expense expense) {
        return new ExpenseDto(
                expense.getId(),
                expense.getCategory(),
                expense.getMerchant(),
                expense.getAmount(),
                expense.getSpentDate(),
                expense.getMemo(),
                expense.getCreatedAt()
        );
    }
}
