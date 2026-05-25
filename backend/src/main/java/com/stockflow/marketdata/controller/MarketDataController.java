package com.stockflow.marketdata.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.marketdata.dto.DataRefreshResultDto;
import com.stockflow.marketdata.service.MarketDataRefreshService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class MarketDataController {

    private final MarketDataRefreshService marketDataRefreshService;

    @GetMapping("/status")
    public ApiResponse<DataRefreshResultDto> status() {
        return ApiResponse.success(marketDataRefreshService.status());
    }

    @PostMapping("/refresh")
    public ApiResponse<DataRefreshResultDto> refresh() {
        return ApiResponse.success(marketDataRefreshService.refreshStocks());
    }
}
