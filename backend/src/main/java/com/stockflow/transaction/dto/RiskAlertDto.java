package com.stockflow.transaction.dto;

public record RiskAlertDto(
        String title,
        String description,
        String severity
) {
}
