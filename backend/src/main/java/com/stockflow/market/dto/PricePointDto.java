package com.stockflow.market.dto;

import com.stockflow.global.type.TargetType;
import com.stockflow.market.entity.PricePoint;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PricePointDto(
        Long id,
        TargetType targetType,
        String targetCode,
        String label,
        BigDecimal price,
        Long volume,
        LocalDateTime createdAt
) {
    public static PricePointDto from(PricePoint pricePoint) {
        return new PricePointDto(
                pricePoint.getId(),
                pricePoint.getTargetType(),
                pricePoint.getTargetCode(),
                pricePoint.getLabel(),
                pricePoint.getPrice(),
                pricePoint.getVolume(),
                pricePoint.getCreatedAt()
        );
    }
}
