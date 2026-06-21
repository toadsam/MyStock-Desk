package com.stockflow.company.dto;

import java.math.BigDecimal;

public record CompanyMetricDto(
        String label,
        BigDecimal value,
        String unit,
        String tone,
        String description
) {
}
