package com.stockflow.company.dto;

import com.stockflow.stock.dto.StockDto;
import java.util.List;

public record CompanyAnalysisDto(
        StockDto stock,
        List<CompanyMetricDto> metrics,
        List<CompanyPerformancePointDto> performance,
        String aiSummary,
        String portfolioImpact,
        boolean dividendAvailable
) {
}
