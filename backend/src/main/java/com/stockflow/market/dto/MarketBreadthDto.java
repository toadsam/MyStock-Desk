package com.stockflow.market.dto;

import java.math.BigDecimal;

public record MarketBreadthDto(
        Integer rising,
        Integer falling,
        Integer unchanged,
        BigDecimal risingRatio,
        BigDecimal fallingRatio,
        BigDecimal foreignNetBuy,
        BigDecimal institutionNetBuy,
        BigDecimal individualNetBuy
) {
}
