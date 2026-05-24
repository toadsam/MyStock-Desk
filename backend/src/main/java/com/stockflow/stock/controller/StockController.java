package com.stockflow.stock.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.market.dto.PricePointDto;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.stock.dto.OrderBookDto;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.service.StockService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ApiResponse<List<StockDto>> stocks() {
        return ApiResponse.success(stockService.getStocks());
    }

    @GetMapping("/{symbol}")
    public ApiResponse<StockDto> stock(@PathVariable String symbol) {
        return ApiResponse.success(stockService.getStock(symbol));
    }

    @GetMapping("/{symbol}/prices")
    public ApiResponse<List<PricePointDto>> prices(@PathVariable String symbol) {
        return ApiResponse.success(stockService.getStockPrices(symbol));
    }

    @GetMapping("/{symbol}/orderbook")
    public ApiResponse<OrderBookDto> orderBook(@PathVariable String symbol) {
        return ApiResponse.success(stockService.getOrderBook(symbol));
    }

    @GetMapping("/{symbol}/news")
    public ApiResponse<List<NewsDto>> news(@PathVariable String symbol) {
        return ApiResponse.success(stockService.getStockNews(symbol));
    }
}
