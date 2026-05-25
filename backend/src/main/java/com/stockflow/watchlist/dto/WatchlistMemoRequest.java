package com.stockflow.watchlist.dto;

public record WatchlistMemoRequest(
        String reason,
        String checkPoints,
        String priceMemo
) {
}
