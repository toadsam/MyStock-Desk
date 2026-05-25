package com.stockflow.portfolio.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.portfolio.dto.AllocationDto;
import com.stockflow.portfolio.dto.HoldingDto;
import com.stockflow.portfolio.dto.PerformancePointDto;
import com.stockflow.portfolio.dto.PortfolioDto;
import com.stockflow.portfolio.dto.PortfolioStudyCandidateDto;
import com.stockflow.portfolio.dto.TransactionDto;
import com.stockflow.portfolio.service.PortfolioService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping
    public ApiResponse<PortfolioDto> portfolio() {
        return ApiResponse.success(portfolioService.getPortfolio());
    }

    @GetMapping("/holdings")
    public ApiResponse<List<HoldingDto>> holdings() {
        return ApiResponse.success(portfolioService.getHoldings());
    }

    @GetMapping("/performance")
    public ApiResponse<List<PerformancePointDto>> performance() {
        return ApiResponse.success(portfolioService.getPerformance());
    }

    @GetMapping("/allocation")
    public ApiResponse<List<AllocationDto>> allocation() {
        return ApiResponse.success(portfolioService.getAllocation());
    }

    @GetMapping("/study-candidates")
    public ApiResponse<List<PortfolioStudyCandidateDto>> studyCandidates() {
        return ApiResponse.success(portfolioService.getStudyCandidates());
    }

    @GetMapping("/transactions")
    public ApiResponse<List<TransactionDto>> transactions() {
        return ApiResponse.success(portfolioService.getTransactions());
    }
}
