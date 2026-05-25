package com.stockflow.trade.repository;

import com.stockflow.trade.entity.TradeLedger;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeLedgerRepository extends JpaRepository<TradeLedger, Long> {

    List<TradeLedger> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    Optional<TradeLedger> findFirstByOrderId(Long orderId);
}
