package com.stockflow.market.dto;

import java.math.BigDecimal;
import java.util.List;

public record HeatmapSectorDto(
        String sectorName,
        BigDecimal changeRate,
        List<HeatmapStockDto> stocks
) {
}
