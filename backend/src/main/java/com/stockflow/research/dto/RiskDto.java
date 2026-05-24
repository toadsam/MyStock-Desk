package com.stockflow.research.dto;

public record RiskDto(
        String title,
        String description,
        Integer riskScore
) {
}
