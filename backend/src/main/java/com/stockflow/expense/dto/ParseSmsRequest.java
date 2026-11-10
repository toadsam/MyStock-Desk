package com.stockflow.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 카드 승인 문자 붙여넣기. 여러 건을 줄바꿈으로 이어 붙여도 된다. */
public record ParseSmsRequest(
        @NotBlank @Size(max = 20000, message = "문자는 한 번에 2만 자까지 붙여 넣을 수 있어요.") String text
) {
}
