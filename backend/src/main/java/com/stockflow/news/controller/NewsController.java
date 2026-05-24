package com.stockflow.news.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.global.type.ImpactType;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.news.service.NewsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public ApiResponse<List<NewsDto>> news(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) ImpactType impactType,
            @RequestParam(required = false) String symbol
    ) {
        return ApiResponse.success(newsService.getNews(category, impactType, symbol));
    }

    @GetMapping("/briefing")
    public ApiResponse<List<NewsDto>> briefing() {
        return ApiResponse.success(newsService.getBriefing());
    }

    @GetMapping("/research")
    public ApiResponse<List<NewsDto>> research() {
        return ApiResponse.success(newsService.getResearchNews());
    }
}
