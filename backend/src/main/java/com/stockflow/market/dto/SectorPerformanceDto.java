package com.stockflow.market.dto;

import com.stockflow.global.type.SectorPerformanceType;
import com.stockflow.market.entity.SectorPerformance;
import java.math.BigDecimal;

public record SectorPerformanceDto(
        String sectorName,
        BigDecimal changeRate,
        Integer ranking,
        SectorPerformanceType type
) {
    public static SectorPerformanceDto from(SectorPerformance sector) {
        return new SectorPerformanceDto(
                sector.getSectorName(),
                sector.getChangeRate(),
                sector.getRanking(),
                sector.getType()
        );
    }
}
