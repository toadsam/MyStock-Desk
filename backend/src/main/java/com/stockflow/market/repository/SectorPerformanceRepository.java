package com.stockflow.market.repository;

import com.stockflow.market.entity.SectorPerformance;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectorPerformanceRepository extends JpaRepository<SectorPerformance, Long> {
    List<SectorPerformance> findAllByOrderByRankingAsc();
}
