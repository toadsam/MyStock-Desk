package com.stockflow.trade.repository;

import com.stockflow.trade.entity.Execution;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findByOrderId(Long orderId);

    List<Execution> findAllByOrderByExecutedAtDesc();
}
