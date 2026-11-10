package com.stockflow.watchlist.dto;

import jakarta.validation.constraints.Size;

public record WatchlistMemoRequest(
        @Size(max = 1000, message = "이유는 1,000자 이내로 적어 주세요.") String reason,
        @Size(max = 1000, message = "확인할 점은 1,000자 이내로 적어 주세요.") String checkPoints,
        @Size(max = 200, message = "가격 메모는 200자 이내로 적어 주세요.") String priceMemo
) {
}
