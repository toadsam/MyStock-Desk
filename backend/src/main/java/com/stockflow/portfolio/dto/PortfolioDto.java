package com.stockflow.portfolio.dto;

import com.stockflow.portfolio.entity.Portfolio;
import java.math.BigDecimal;

public record PortfolioDto(
        Long id,
        Long memberId,
        BigDecimal totalAsset,
        BigDecimal cash,
        BigDecimal totalPurchaseAmount,
        BigDecimal totalEvaluationAmount,
        BigDecimal totalProfitLoss,
        BigDecimal totalReturnRate,
        BigDecimal dailyProfitLoss,
        BigDecimal dailyReturnRate
) {
    public static PortfolioDto from(Portfolio portfolio) {
        return new PortfolioDto(
                portfolio.getId(),
                portfolio.getMemberId(),
                portfolio.getTotalAsset(),
                portfolio.getCash(),
                portfolio.getTotalPurchaseAmount(),
                portfolio.getTotalEvaluationAmount(),
                portfolio.getTotalProfitLoss(),
                portfolio.getTotalReturnRate(),
                portfolio.getDailyProfitLoss(),
                portfolio.getDailyReturnRate()
        );
    }
}
