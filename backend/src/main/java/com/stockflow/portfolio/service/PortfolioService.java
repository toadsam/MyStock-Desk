package com.stockflow.portfolio.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.global.type.TransactionType;
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
import com.stockflow.transaction.entity.InvestmentTransaction;
import com.stockflow.transaction.repository.InvestmentTransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final StockRepository stockRepository;
    private final InvestmentTransactionRepository transactionRepository;
    private final CurrentMemberProvider currentMemberProvider;
    private final PortfolioSnapshotService portfolioSnapshotService;

    @Transactional
    public PortfolioDto getPortfolio() {
        Portfolio portfolio = findPortfolio();
        portfolioSnapshotService.refresh(portfolio);
        return PortfolioDto.from(portfolio);
    }

    @Transactional
    public List<HoldingDto> getHoldings() {
        Portfolio portfolio = findPortfolio();
        portfolioSnapshotService.refresh(portfolio);
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

    @Transactional
    public List<AllocationDto> getAllocation() {
        Portfolio portfolio = findPortfolio();
        portfolioSnapshotService.refresh(portfolio);
        BigDecimal totalAsset = portfolio.getTotalAsset();
        List<AllocationDto> allocation = new ArrayList<>();
        BigDecimal domesticStock = portfolio.getTotalEvaluationAmount();
        if (domesticStock.compareTo(BigDecimal.ZERO) > 0) {
            allocation.add(new AllocationDto("국내 주식", domesticStock, rate(domesticStock, totalAsset)));
        }
        if (portfolio.getCash().compareTo(BigDecimal.ZERO) > 0) {
            allocation.add(new AllocationDto("현금", portfolio.getCash(), rate(portfolio.getCash(), totalAsset)));
        }
        return allocation;
    }

    public List<TransactionDto> getTransactions() {
        return transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(currentMemberProvider.currentMemberId()).stream()
                .limit(10)
                .map(this::toTransaction)
                .toList();
    }

    private TransactionDto toTransaction(InvestmentTransaction transaction) {
        BigDecimal amount = transaction.getTotalAmount();
        if (transaction.getTransactionType() == TransactionType.BUY || transaction.getTransactionType() == TransactionType.WITHDRAWAL) {
            amount = amount.negate();
        }
        return new TransactionDto(
                transaction.getId(),
                transaction.getStockName(),
                transaction.getSymbol(),
                transaction.getTransactionType(),
                transaction.getPrice(),
                transaction.getQuantity(),
                amount,
                transaction.getRealizedProfitLoss(),
                transaction.getCreatedAt()
        );
    }

    private Portfolio findPortfolio() {
        return portfolioRepository.findByMemberId(currentMemberProvider.currentMemberId())
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
    }

    private BigDecimal rate(BigDecimal value, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return value.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }

    private Stock findStock(Long stockId) {
        return stockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
    }
}
