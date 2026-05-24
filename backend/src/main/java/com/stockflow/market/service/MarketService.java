package com.stockflow.market.service;

import com.stockflow.global.type.TargetType;
import com.stockflow.market.dto.HeatmapSectorDto;
import com.stockflow.market.dto.HeatmapStockDto;
import com.stockflow.market.dto.MarketBreadthDto;
import com.stockflow.market.dto.MarketIndexDto;
import com.stockflow.market.dto.PricePointDto;
import com.stockflow.market.dto.SectorPerformanceDto;
import com.stockflow.market.repository.MarketIndexRepository;
import com.stockflow.market.repository.PricePointRepository;
import com.stockflow.market.repository.SectorPerformanceRepository;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final MarketIndexRepository marketIndexRepository;
    private final PricePointRepository pricePointRepository;
    private final SectorPerformanceRepository sectorPerformanceRepository;
    private final StockRepository stockRepository;

    public List<MarketIndexDto> getIndices() {
        return marketIndexRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(MarketIndexDto::from)
                .toList();
    }

    public List<PricePointDto> getIndexPrices(String code) {
        marketIndexRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("지수를 찾을 수 없습니다: " + code));
        return pricePointRepository.findByTargetTypeAndTargetCodeOrderByCreatedAtAsc(TargetType.INDEX, code)
                .stream()
                .map(PricePointDto::from)
                .toList();
    }

    public List<HeatmapSectorDto> getHeatmap() {
        Map<String, List<Stock>> grouped = stockRepository.findAll().stream()
                .collect(Collectors.groupingBy(Stock::getSector, LinkedHashMap::new, Collectors.toList()));
        return grouped.entrySet().stream()
                .map(entry -> new HeatmapSectorDto(
                        entry.getKey(),
                        averageChangeRate(entry.getValue()),
                        entry.getValue().stream()
                                .map(stock -> new HeatmapStockDto(
                                        stock.getSymbol(),
                                        stock.getName(),
                                        stock.getChangeRate(),
                                        stock.getMarketCap()
                                ))
                                .toList()
                ))
                .toList();
    }

    public List<SectorPerformanceDto> getSectors() {
        return sectorPerformanceRepository.findAllByOrderByRankingAsc().stream()
                .map(SectorPerformanceDto::from)
                .toList();
    }

    public MarketBreadthDto getBreadth() {
        return new MarketBreadthDto(
                609,
                245,
                70,
                BigDecimal.valueOf(69),
                BigDecimal.valueOf(27),
                BigDecimal.valueOf(4215),
                BigDecimal.valueOf(1287),
                BigDecimal.valueOf(-5502)
        );
    }

    private BigDecimal averageChangeRate(List<Stock> stocks) {
        BigDecimal total = stocks.stream()
                .map(Stock::getChangeRate)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(stocks.size()), 2, RoundingMode.HALF_UP);
    }
}
