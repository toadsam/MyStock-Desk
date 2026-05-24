package com.stockflow.market.repository;

import com.stockflow.market.entity.MarketIndex;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketIndexRepository extends JpaRepository<MarketIndex, Long> {
    List<MarketIndex> findAllByOrderByDisplayOrderAsc();

    Optional<MarketIndex> findByCode(String code);
}
