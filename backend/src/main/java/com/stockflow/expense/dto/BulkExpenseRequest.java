package com.stockflow.expense.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** 확인 화면에서 체크한 후보들을 한 번에 저장한다. */
public record BulkExpenseRequest(
        @NotEmpty @Valid List<ExpenseRequest> items
) {
}
