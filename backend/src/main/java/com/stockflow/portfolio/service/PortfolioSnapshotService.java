package com.stockflow.portfolio.service;

import com.stockflow.portfolio.entity.Holding;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.HoldingRepository;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PortfolioSnapshotService {

    private final HoldingRepository holdingRepository;
    private final StockRepository stockRepository;

    public void refresh(Portfolio portfolio) {
        List<Holding> holdings = new ArrayList<>(holdingRepository.findByPortfolioIdOrderByWeightDesc(portfolio.getId()));
        BigDecimal totalPurchaseAmount = BigDecimal.ZERO;
        BigDecimal totalEvaluationAmount = BigDecimal.ZERO;

        for (Holding holding : holdings) {
            Stock stock = stockRepository.findById(holding.getStockId())
                    .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
            holding.refresh(stock.getCurrentPrice(), BigDecimal.ONE);
            totalPurchaseAmount = totalPurchaseAmount.add(holding.purchaseAmount());
            totalEvaluationAmount = totalEvaluationAmount.add(holding.getEvaluationAmount());
        }

        portfolio.refreshTotals(totalPurchaseAmount, totalEvaluationAmount);

        for (Holding holding : holdings) {
            Stock stock = stockRepository.findById(holding.getStockId())
                    .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
            holding.refresh(stock.getCurrentPrice(), portfolio.getTotalAsset());
        }
    }
}
