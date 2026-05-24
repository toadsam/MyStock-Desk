package com.stockflow.research.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.research.dto.PortfolioImpactDto;
import com.stockflow.research.dto.RecommendationDto;
import com.stockflow.research.dto.ResearchBriefingDto;
import com.stockflow.research.dto.RiskDto;
import com.stockflow.research.dto.SentimentDto;
import com.stockflow.research.service.ResearchService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/research")
@RequiredArgsConstructor
public class ResearchController {

    private final ResearchService researchService;

    @GetMapping("/briefing")
    public ApiResponse<ResearchBriefingDto> briefing() {
        return ApiResponse.success(researchService.getBriefing());
    }

    @GetMapping("/sentiment")
    public ApiResponse<SentimentDto> sentiment() {
        return ApiResponse.success(researchService.getSentiment());
    }

    @GetMapping("/risks")
    public ApiResponse<List<RiskDto>> risks() {
        return ApiResponse.success(researchService.getRisks());
    }

    @GetMapping("/recommendations")
    public ApiResponse<List<RecommendationDto>> recommendations() {
        return ApiResponse.success(researchService.getRecommendations());
    }

    @GetMapping("/portfolio-impact")
    public ApiResponse<List<PortfolioImpactDto>> portfolioImpact() {
        return ApiResponse.success(researchService.getPortfolioImpact());
    }
}
