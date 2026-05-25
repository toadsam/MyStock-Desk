package com.stockflow.marketdata.provider;

import com.stockflow.marketdata.dto.StockQuoteSnapshot;
import com.stockflow.stock.entity.Stock;
import java.util.List;

public interface MarketDataProvider {

    String providerName();

    boolean supportsExternalApi();

    List<StockQuoteSnapshot> fetchQuotes(List<Stock> stocks);
}
