package com.stockflow.marketdata.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.marketdata.dto.StockQuoteSnapshot;
import com.stockflow.stock.entity.Stock;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Objects;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "stockflow.market-data.provider", havingValue = "yahoo")
public class YahooFinanceMarketDataProvider implements MarketDataProvider {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String providerName() {
        return "Yahoo Finance Chart API";
    }

    @Override
    public boolean supportsExternalApi() {
        return true;
    }

    @Override
    public List<StockQuoteSnapshot> fetchQuotes(List<Stock> stocks) {
        return stocks.stream()
                .map(this::fetchQuote)
                .filter(Objects::nonNull)
                .toList();
    }

    private StockQuoteSnapshot fetchQuote(Stock stock) {
        try {
            String yahooSymbol = toYahooSymbol(stock.getSymbol());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://query1.finance.yahoo.com/v8/finance/chart/" + yahooSymbol + "?interval=1d&range=1d"))
                    .timeout(Duration.ofSeconds(6))
                    .header("User-Agent", "StockFlow/1.0")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }
            JsonNode meta = objectMapper.readTree(response.body())
                    .path("chart").path("result").path(0).path("meta");
            if (meta.isMissingNode() || meta.path("regularMarketPrice").isMissingNode()) {
                return null;
            }
            BigDecimal currentPrice = decimal(meta, "regularMarketPrice", stock.getCurrentPrice());
            BigDecimal highPrice = decimal(meta, "regularMarketDayHigh", currentPrice);
            BigDecimal lowPrice = decimal(meta, "regularMarketDayLow", currentPrice);
            long volume = meta.path("regularMarketVolume").asLong(stock.getVolume() == null ? 0L : stock.getVolume());
            BigDecimal tradingValue = currentPrice.multiply(BigDecimal.valueOf(volume)).setScale(0, RoundingMode.HALF_UP);
            return new StockQuoteSnapshot(stock.getSymbol(), currentPrice, highPrice, lowPrice, volume, tradingValue);
        } catch (Exception ignored) {
            return null;
        }
    }

    private BigDecimal decimal(JsonNode node, String field, BigDecimal fallback) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return fallback == null ? BigDecimal.ZERO : fallback;
        }
        return BigDecimal.valueOf(value.asDouble()).setScale(2, RoundingMode.HALF_UP).stripTrailingZeros();
    }

    private String toYahooSymbol(String symbol) {
        if (symbol != null && symbol.matches("\\d{6}")) {
            return symbol + ".KS";
        }
        return symbol;
    }
}
