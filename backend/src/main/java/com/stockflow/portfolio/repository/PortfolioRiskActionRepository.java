package com.stockflow.portfolio.repository;

import com.stockflow.portfolio.entity.PortfolioRiskAction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioRiskActionRepository extends JpaRepository<PortfolioRiskAction, Long> {

    List<PortfolioRiskAction> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
