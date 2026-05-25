package com.stockflow.ai.controller;

import com.stockflow.ai.dto.PortfolioReportDto;
import com.stockflow.ai.service.PortfolioReportService;
import com.stockflow.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/portfolio-report")
@RequiredArgsConstructor
public class PortfolioReportController {

    private final PortfolioReportService portfolioReportService;

    @GetMapping("/latest")
    public ApiResponse<PortfolioReportDto> latest() {
        return ApiResponse.success(portfolioReportService.latest());
    }

    @PostMapping
    public ApiResponse<PortfolioReportDto> generate() {
        return ApiResponse.success(portfolioReportService.latest());
    }
}
