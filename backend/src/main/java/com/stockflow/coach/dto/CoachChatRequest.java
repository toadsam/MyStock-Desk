package com.stockflow.coach.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CoachChatRequest(
        @NotBlank @Size(max = 500, message = "질문은 500자 이내로 적어 주세요.") String message
) {
}
