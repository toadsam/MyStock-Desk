package com.stockflow.portfolio.repository;

import com.stockflow.portfolio.entity.Holding;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
    List<Holding> findByPortfolioIdOrderByWeightDesc(Long portfolioId);

    Optional<Holding> findByPortfolioIdAndStockId(Long portfolioId, Long stockId);
}
