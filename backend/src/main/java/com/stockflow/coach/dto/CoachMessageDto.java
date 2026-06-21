package com.stockflow.coach.dto;

import com.stockflow.coach.entity.FinancialCoachMessage;
import java.time.LocalDateTime;

public record CoachMessageDto(
        Long id,
        String role,
        String content,
        LocalDateTime createdAt
) {
    public static CoachMessageDto from(FinancialCoachMessage message) {
        return new CoachMessageDto(message.getId(), message.getRole(), message.getContent(), message.getCreatedAt());
    }
}
