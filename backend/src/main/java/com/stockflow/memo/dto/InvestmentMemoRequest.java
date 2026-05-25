package com.stockflow.memo.dto;

import com.stockflow.global.type.MemoType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record InvestmentMemoRequest(
        String symbol,
        @NotNull MemoType memoType,
        @NotBlank String title,
        String content,
        List<String> checklist
) {
}
