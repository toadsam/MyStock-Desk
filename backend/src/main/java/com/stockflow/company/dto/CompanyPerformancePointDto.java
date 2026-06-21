package com.stockflow.company.dto;

import java.math.BigDecimal;

public record CompanyPerformancePointDto(
        String year,
        BigDecimal sales,
        BigDecimal operatingProfit
) {
}
