package com.stockflow.memo.dto;

import com.stockflow.global.type.MemoType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record InvestmentMemoRequest(
        @Size(max = 20) String symbol,
        @NotNull MemoType memoType,
        @NotBlank @Size(max = 100, message = "제목은 100자 이내로 적어 주세요.") String title,
        @Size(max = 5000, message = "내용은 5,000자 이내로 적어 주세요.") String content,
        @Size(max = 30) List<@Size(max = 200) String> checklist
) {
}
