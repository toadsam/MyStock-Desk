package com.stockflow.expense.dto;

import jakarta.validation.constraints.NotBlank;

/** 카드 승인 문자 붙여넣기. 여러 건을 줄바꿈으로 이어 붙여도 된다. */
public record ParseSmsRequest(
        @NotBlank String text
) {
}
