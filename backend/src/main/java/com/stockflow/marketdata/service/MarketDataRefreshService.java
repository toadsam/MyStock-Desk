package com.stockflow.marketdata.service;

import com.stockflow.global.type.TargetType;
import com.stockflow.market.entity.PricePoint;
import com.stockflow.market.repository.PricePointRepository;
import com.stockflow.marketdata.dto.DataRefreshResultDto;
import com.stockflow.marketdata.dto.StockQuoteSnapshot;
import com.stockflow.marketdata.provider.MarketDataProvider;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarketDataRefreshService {

    private static final DateTimeFormatter LABEL_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final MarketDataProvider marketDataProvider;
    private final StockRepository stockRepository;
    private final PricePointRepository pricePointRepository;

    @Value("${stockflow.data-refresh.enabled:false}")
    private boolean scheduledRefreshEnabled;

    @Transactional
    public DataRefreshResultDto refreshStocks() {
        return doRefresh();
    }

    public DataRefreshResultDto status() {
        return new DataRefreshResultDto(
                marketDataProvider.providerName(),
                0,
                LocalDateTime.now(),
                marketDataProvider.supportsExternalApi(),
                marketDataProvider.supportsExternalApi()
                        ? "외부 시세 Provider를 사용합니다. 실제 주문/체결과는 연결되지 않습니다."
                        : "현재는 데모 시세 Provider를 사용합니다. 외부 API Provider를 추가해 교체할 수 있습니다."
        );
    }

    @Scheduled(fixedDelayString = "${stockflow.data-refresh.fixed-delay-ms:60000}")
    @Transactional
    public void refreshBySchedule() {
        if (scheduledRefreshEnabled) {
            doRefresh();
        }
    }

    private DataRefreshResultDto doRefresh() {
        LocalDateTime refreshedAt = LocalDateTime.now();
        var stocks = stockRepository.findAll();
        Map<String, StockQuoteSnapshot> quoteBySymbol = marketDataProvider.fetchQuotes(stocks).stream()
                .collect(Collectors.toMap(StockQuoteSnapshot::symbol, Function.identity()));

        for (Stock stock : stocks) {
            StockQuoteSnapshot quote = quoteBySymbol.get(stock.getSymbol());
            if (quote == null) {
                continue;
            }
            stock.updateQuote(
                    quote.currentPrice(),
                    quote.highPrice(),
                    quote.lowPrice(),
                    quote.volume(),
                    quote.tradingValue()
            );
            pricePointRepository.save(PricePoint.builder()
                    .targetType(TargetType.STOCK)
                    .targetCode(stock.getSymbol())
                    .label(refreshedAt.format(LABEL_FORMAT))
                    .price(quote.currentPrice())
                    .volume(quote.volume())
                    .createdAt(refreshedAt)
                    .build());
        }

        return new DataRefreshResultDto(
                marketDataProvider.providerName(),
                quoteBySymbol.size(),
                refreshedAt,
                marketDataProvider.supportsExternalApi(),
                marketDataProvider.supportsExternalApi()
                        ? "외부 시세 데이터가 갱신되었습니다. 실제 증권사 주문/체결과는 연결되지 않습니다."
                        : "시세 mock 데이터가 갱신되었습니다. 실제 증권사 주문/체결과는 연결되지 않습니다."
        );
    }
}
