package com.stockflow.stock.service;

import com.stockflow.global.type.TargetType;
import com.stockflow.market.dto.PricePointDto;
import com.stockflow.market.repository.PricePointRepository;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.news.service.NewsService;
import com.stockflow.stock.dto.OrderBookDto;
import com.stockflow.stock.dto.OrderBookLevelDto;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final PricePointRepository pricePointRepository;
    private final NewsService newsService;

    public List<StockDto> getStocks() {
        return stockRepository.findAll().stream()
                .map(StockDto::from)
                .toList();
    }

    public StockDto getStock(String symbol) {
        return StockDto.from(findStock(symbol));
    }

    public List<PricePointDto> getStockPrices(String symbol) {
        findStock(symbol);
        return pricePointRepository.findByTargetTypeAndTargetCodeOrderByCreatedAtAsc(TargetType.STOCK, symbol)
                .stream()
                .map(PricePointDto::from)
                .toList();
    }

    public OrderBookDto getOrderBook(String symbol) {
        Stock stock = findStock(symbol);
        BigDecimal current = stock.getCurrentPrice();
        List<OrderBookLevelDto> asks = IntStream.iterate(5, index -> index - 1)
                .limit(5)
                .mapToObj(index -> new OrderBookLevelDto(
                        current.add(BigDecimal.valueOf(index * 100L)),
                        540_000L + index * 173_421L,
                        BigDecimal.valueOf(1.82 + index * 0.13).setScale(2, java.math.RoundingMode.HALF_UP)
                ))
                .toList();
        List<OrderBookLevelDto> bids = IntStream.rangeClosed(1, 5)
                .mapToObj(index -> new OrderBookLevelDto(
                        current.subtract(BigDecimal.valueOf(index * 100L)),
                        780_000L + index * 118_372L,
                        BigDecimal.valueOf(-1.04 - index * 0.13).setScale(2, java.math.RoundingMode.HALF_UP)
                ))
                .toList();
        return new OrderBookDto(symbol, current, asks, bids, BigDecimal.valueOf(112.35));
    }

    public List<NewsDto> getStockNews(String symbol) {
        findStock(symbol);
        return newsService.getStockNews(symbol);
    }

    private Stock findStock(String symbol) {
        return stockRepository.findBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다: " + symbol));
    }
}
