package com.stockflow.market.repository;

import com.stockflow.global.type.TargetType;
import com.stockflow.market.entity.PricePoint;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricePointRepository extends JpaRepository<PricePoint, Long> {
    List<PricePoint> findByTargetTypeAndTargetCodeOrderByCreatedAtAsc(TargetType targetType, String targetCode);
}
