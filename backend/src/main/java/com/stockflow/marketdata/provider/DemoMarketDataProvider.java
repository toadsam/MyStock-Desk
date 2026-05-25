package com.stockflow.marketdata.provider;

import com.stockflow.marketdata.dto.StockQuoteSnapshot;
import com.stockflow.stock.entity.Stock;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(MarketDataProvider.class)
public class DemoMarketDataProvider implements MarketDataProvider {

    @Override
    public String providerName() {
        return "StockFlow Demo Feed";
    }

    @Override
    public boolean supportsExternalApi() {
        return false;
    }

    @Override
    public List<StockQuoteSnapshot> fetchQuotes(List<Stock> stocks) {
        int minuteSeed = LocalDateTime.now().getMinute();
        return stocks.stream()
                .map(stock -> toQuote(stock, minuteSeed))
                .toList();
    }

    private StockQuoteSnapshot toQuote(Stock stock, int minuteSeed) {
        int direction = Math.floorMod(stock.getSymbol().hashCode() + minuteSeed, 11) - 5;
        BigDecimal driftRate = BigDecimal.valueOf(direction).multiply(new BigDecimal("0.0012"));
        BigDecimal nextPrice = stock.getCurrentPrice()
                .multiply(BigDecimal.ONE.add(driftRate))
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal highPrice = stock.getHighPrice().max(nextPrice);
        BigDecimal lowPrice = stock.getLowPrice().min(nextPrice);
        long nextVolume = stock.getVolume() + 12_000L + Math.abs(direction) * 3_700L;
        BigDecimal tradingValue = nextPrice.multiply(BigDecimal.valueOf(nextVolume)).setScale(0, RoundingMode.HALF_UP);
        return new StockQuoteSnapshot(
                stock.getSymbol(),
                nextPrice,
                highPrice,
                lowPrice,
                nextVolume,
                tradingValue
        );
    }
}
