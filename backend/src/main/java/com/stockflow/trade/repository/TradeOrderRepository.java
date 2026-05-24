package com.stockflow.trade.repository;

import com.stockflow.global.type.OrderStatus;
import com.stockflow.trade.entity.TradeOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeOrderRepository extends JpaRepository<TradeOrder, Long> {
    List<TradeOrder> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<TradeOrder> findTop10ByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<TradeOrder> findByMemberIdAndStatusOrderByCreatedAtDesc(Long memberId, OrderStatus status);
}
