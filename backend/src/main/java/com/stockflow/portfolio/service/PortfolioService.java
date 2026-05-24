package com.stockflow.portfolio.service;

import com.stockflow.global.type.OrderType;
import com.stockflow.portfolio.dto.AllocationDto;
import com.stockflow.portfolio.dto.HoldingDto;
import com.stockflow.portfolio.dto.PerformancePointDto;
import com.stockflow.portfolio.dto.PortfolioDto;
import com.stockflow.portfolio.dto.TransactionDto;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.HoldingRepository;
import com.stockflow.portfolio.repository.PortfolioRepository;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import com.stockflow.trade.entity.TradeOrder;
import com.stockflow.trade.repository.TradeOrderRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final StockRepository stockRepository;
    private final TradeOrderRepository tradeOrderRepository;

    @Value("${stockflow.mock-member-id:1}")
    private Long mockMemberId;

    public PortfolioDto getPortfolio() {
        return PortfolioDto.from(findPortfolio());
    }

    public List<HoldingDto> getHoldings() {
        Portfolio portfolio = findPortfolio();
        return holdingRepository.findByPortfolioIdOrderByWeightDesc(portfolio.getId()).stream()
                .map(holding -> {
                    Stock stock = findStock(holding.getStockId());
                    return HoldingDto.of(holding, StockDto.from(stock));
                })
                .toList();
    }

    public List<PerformancePointDto> getPerformance() {
        return List.of(
                new PerformancePointDto("2024.06", BigDecimal.valueOf(96500000), BigDecimal.valueOf(94800000)),
                new PerformancePointDto("2024.07", BigDecimal.valueOf(103200000), BigDecimal.valueOf(98700000)),
                new PerformancePointDto("2024.08", BigDecimal.valueOf(111700000), BigDecimal.valueOf(102500000)),
                new PerformancePointDto("2024.09", BigDecimal.valueOf(116200000), BigDecimal.valueOf(106300000)),
                new PerformancePointDto("2024.10", BigDecimal.valueOf(121900000), BigDecimal.valueOf(108900000)),
                new PerformancePointDto("2024.11", BigDecimal.valueOf(124600000), BigDecimal.valueOf(110700000)),
                new PerformancePointDto("2024.12", BigDecimal.valueOf(130100000), BigDecimal.valueOf(112200000)),
                new PerformancePointDto("2025.01", BigDecimal.valueOf(128500000), BigDecimal.valueOf(109800000)),
                new PerformancePointDto("2025.02", BigDecimal.valueOf(132300000), BigDecimal.valueOf(111600000)),
                new PerformancePointDto("2025.03", BigDecimal.valueOf(136900000), BigDecimal.valueOf(114700000)),
                new PerformancePointDto("2025.04", BigDecimal.valueOf(144500000), BigDecimal.valueOf(118900000)),
                new PerformancePointDto("2025.05", BigDecimal.valueOf(153780350), BigDecimal.valueOf(121400000))
        );
    }

    public List<AllocationDto> getAllocation() {
        return List.of(
                new AllocationDto("국내 주식", BigDecimal.valueOf(111210000), BigDecimal.valueOf(72.3)),
                new AllocationDto("해외 주식", BigDecimal.valueOf(22600000), BigDecimal.valueOf(14.7)),
                new AllocationDto("ETF", BigDecimal.valueOf(9990000), BigDecimal.valueOf(6.5)),
                new AllocationDto("현금", BigDecimal.valueOf(8450000), BigDecimal.valueOf(5.5)),
                new AllocationDto("채권", BigDecimal.valueOf(1530000), BigDecimal.valueOf(1.0))
        );
    }

    public List<TransactionDto> getTransactions() {
        return tradeOrderRepository.findTop10ByMemberIdOrderByCreatedAtDesc(mockMemberId).stream()
                .map(this::toTransaction)
                .toList();
    }

    private TransactionDto toTransaction(TradeOrder order) {
        Stock stock = findStock(order.getStockId());
        BigDecimal amount = order.getEstimatedAmount();
        if (order.getOrderType() == OrderType.SELL) {
            amount = amount.negate();
        }
        return new TransactionDto(
                order.getId(),
                stock.getName(),
                stock.getSymbol(),
                order.getOrderType(),
                order.getOrderPrice(),
                order.getQuantity(),
                amount,
                order.getStatus(),
                order.getCreatedAt()
        );
    }

    private Portfolio findPortfolio() {
        return portfolioRepository.findByMemberId(mockMemberId)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
    }

    private Stock findStock(Long stockId) {
        return stockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
    }
}
