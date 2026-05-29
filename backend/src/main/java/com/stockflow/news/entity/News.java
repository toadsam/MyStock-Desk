package com.stockflow.news.entity;

import com.stockflow.global.type.ImpactType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String summary;
    private String category;
    private String source;
    private String sourceUrl;
    private String dataProvider;
    private String reliability;
    private Boolean officialSource;

    @Enumerated(EnumType.STRING)
    private ImpactType impactType;

    private String relatedStockSymbol;
    private LocalDateTime publishedAt;
    private LocalDateTime fetchedAt;
    private Integer aiImportanceScore;
}
