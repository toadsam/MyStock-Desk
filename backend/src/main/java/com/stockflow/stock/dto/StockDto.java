package com.stockflow.stock.dto;

import com.stockflow.stock.entity.Stock;
import java.math.BigDecimal;

public record StockDto(
        Long id,
        String symbol,
        String name,
        String market,
        BigDecimal currentPrice,
        BigDecimal previousClose,
        BigDecimal changePrice,
        BigDecimal changeRate,
        BigDecimal highPrice,
        BigDecimal lowPrice,
        Long volume,
        BigDecimal tradingValue,
        String sector,
        String industry,
        BigDecimal marketCap,
        BigDecimal per,
        BigDecimal pbr,
        BigDecimal dividendYield,
        BigDecimal week52High,
        BigDecimal week52Low
) {
    public static StockDto from(Stock stock) {
        return new StockDto(
                stock.getId(),
                stock.getSymbol(),
                stock.getName(),
                stock.getMarket(),
                stock.getCurrentPrice(),
                stock.getPreviousClose(),
                stock.getChangePrice(),
                stock.getChangeRate(),
                stock.getHighPrice(),
                stock.getLowPrice(),
                stock.getVolume(),
                stock.getTradingValue(),
                stock.getSector(),
                stock.getIndustry(),
                stock.getMarketCap(),
                stock.getPer(),
                stock.getPbr(),
                stock.getDividendYield(),
                stock.getWeek52High(),
                stock.getWeek52Low()
        );
    }
}
