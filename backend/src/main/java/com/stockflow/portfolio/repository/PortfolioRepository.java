package com.stockflow.portfolio.repository;

import com.stockflow.portfolio.entity.Portfolio;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    Optional<Portfolio> findByMemberId(Long memberId);
}
