package com.stockflow.research.repository;

import com.stockflow.global.type.InsightType;
import com.stockflow.research.entity.AiInsight;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {
    List<AiInsight> findByTypeOrderByCreatedAtDesc(InsightType type);

    List<AiInsight> findAllByOrderByCreatedAtDesc();
}
