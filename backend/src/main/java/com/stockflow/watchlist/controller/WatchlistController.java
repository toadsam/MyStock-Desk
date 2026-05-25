package com.stockflow.watchlist.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.watchlist.dto.WatchlistDto;
import com.stockflow.watchlist.dto.WatchlistMemoRequest;
import com.stockflow.watchlist.service.WatchlistService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ApiResponse<List<WatchlistDto>> watchlist() {
        return ApiResponse.success(watchlistService.getWatchlist());
    }

    @PostMapping("/{symbol}")
    public ApiResponse<WatchlistDto> add(@PathVariable String symbol) {
        return ApiResponse.success(watchlistService.add(symbol));
    }

    @PatchMapping("/{symbol}")
    public ApiResponse<WatchlistDto> updateMemo(@PathVariable String symbol, @RequestBody WatchlistMemoRequest request) {
        return ApiResponse.success(watchlistService.updateMemo(symbol, request));
    }

    @DeleteMapping("/{symbol}")
    public ApiResponse<Void> delete(@PathVariable String symbol) {
        watchlistService.delete(symbol);
        return ApiResponse.success();
    }
}
