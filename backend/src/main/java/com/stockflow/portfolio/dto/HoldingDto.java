package com.stockflow.portfolio.dto;

import com.stockflow.portfolio.entity.Holding;
import com.stockflow.stock.dto.StockDto;
import java.math.BigDecimal;

public record HoldingDto(
        Long id,
        StockDto stock,
        Integer quantity,
        BigDecimal averagePrice,
        BigDecimal currentPrice,
        BigDecimal evaluationAmount,
        BigDecimal profitLoss,
        BigDecimal returnRate,
        BigDecimal weight
) {
    public static HoldingDto of(Holding holding, StockDto stock) {
        return new HoldingDto(
                holding.getId(),
                stock,
                holding.getQuantity(),
                holding.getAveragePrice(),
                holding.getCurrentPrice(),
                holding.getEvaluationAmount(),
                holding.getProfitLoss(),
                holding.getReturnRate(),
                holding.getWeight()
        );
    }
}
