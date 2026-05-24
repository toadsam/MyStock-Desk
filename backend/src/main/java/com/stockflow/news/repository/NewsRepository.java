package com.stockflow.news.repository;

import com.stockflow.global.type.ImpactType;
import com.stockflow.news.entity.News;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findAllByOrderByPublishedAtDesc();

    List<News> findByCategoryOrderByPublishedAtDesc(String category);

    List<News> findByImpactTypeOrderByPublishedAtDesc(ImpactType impactType);

    List<News> findByRelatedStockSymbolOrderByPublishedAtDesc(String symbol);
}
