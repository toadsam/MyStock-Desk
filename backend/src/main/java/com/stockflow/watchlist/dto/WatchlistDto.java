package com.stockflow.watchlist.dto;

import com.stockflow.stock.dto.StockDto;
import java.time.LocalDateTime;

public record WatchlistDto(
        Long id,
        StockDto stock,
        LocalDateTime createdAt
) {
}
