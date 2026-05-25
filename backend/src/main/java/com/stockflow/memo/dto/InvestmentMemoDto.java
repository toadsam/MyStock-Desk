package com.stockflow.memo.dto;

import com.stockflow.global.type.MemoType;
import com.stockflow.memo.entity.InvestmentMemo;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record InvestmentMemoDto(
        Long id,
        String symbol,
        MemoType memoType,
        String title,
        String content,
        List<String> checklist,
        LocalDateTime createdAt
) {
    public static InvestmentMemoDto from(InvestmentMemo memo) {
        return new InvestmentMemoDto(
                memo.getId(),
                memo.getSymbol(),
                memo.getMemoType(),
                memo.getTitle(),
                memo.getContent(),
                memo.getChecklist() == null || memo.getChecklist().isBlank()
                        ? List.of()
                        : Arrays.stream(memo.getChecklist().split("\\n")).toList(),
                memo.getCreatedAt()
        );
    }
}
