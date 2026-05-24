package com.stockflow.market.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.market.dto.HeatmapSectorDto;
import com.stockflow.market.dto.MarketBreadthDto;
import com.stockflow.market.dto.MarketIndexDto;
import com.stockflow.market.dto.PricePointDto;
import com.stockflow.market.dto.SectorPerformanceDto;
import com.stockflow.market.service.MarketService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    @GetMapping("/indices")
    public ApiResponse<List<MarketIndexDto>> indices() {
        return ApiResponse.success(marketService.getIndices());
    }

    @GetMapping("/indices/{code}/prices")
    public ApiResponse<List<PricePointDto>> indexPrices(@PathVariable String code) {
        return ApiResponse.success(marketService.getIndexPrices(code));
    }

    @GetMapping("/heatmap")
    public ApiResponse<List<HeatmapSectorDto>> heatmap() {
        return ApiResponse.success(marketService.getHeatmap());
    }

    @GetMapping("/sectors")
    public ApiResponse<List<SectorPerformanceDto>> sectors() {
        return ApiResponse.success(marketService.getSectors());
    }

    @GetMapping("/breadth")
    public ApiResponse<MarketBreadthDto> breadth() {
        return ApiResponse.success(marketService.getBreadth());
    }
}
