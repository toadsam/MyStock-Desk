package com.stockflow.marketdata.dto;

import java.time.LocalDateTime;

public record DataRefreshResultDto(
        String provider,
        int refreshedStocks,
        LocalDateTime refreshedAt,
        boolean externalReady,
        String message
) {
}
