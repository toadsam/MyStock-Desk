package com.stockflow.market.dto;

import com.stockflow.market.entity.MarketIndex;
import java.math.BigDecimal;

public record MarketIndexDto(
        Long id,
        String name,
        String code,
        BigDecimal value,
        BigDecimal changeValue,
        BigDecimal changeRate,
        String type,
        Integer displayOrder
) {
    public static MarketIndexDto from(MarketIndex marketIndex) {
        return new MarketIndexDto(
                marketIndex.getId(),
                marketIndex.getName(),
                marketIndex.getCode(),
                marketIndex.getValue(),
                marketIndex.getChangeValue(),
                marketIndex.getChangeRate(),
                marketIndex.getType(),
                marketIndex.getDisplayOrder()
        );
    }
}
