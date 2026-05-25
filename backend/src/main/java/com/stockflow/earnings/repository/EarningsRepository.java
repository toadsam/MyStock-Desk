package com.stockflow.earnings.repository;

import com.stockflow.earnings.entity.Earnings;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EarningsRepository extends JpaRepository<Earnings, Long> {
    List<Earnings> findAllByOrderByAnnouncementDateAsc();

    List<Earnings> findBySymbolOrderByYearDescQuarterDesc(String symbol);

    Optional<Earnings> findFirstBySymbolOrderByAnnouncementDateAsc(String symbol);

    Optional<Earnings> findBySymbolAndYearAndQuarter(String symbol, Integer year, Integer quarter);
}
