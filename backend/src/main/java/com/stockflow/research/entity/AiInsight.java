package com.stockflow.research.entity;

import com.stockflow.global.type.InsightType;
import com.stockflow.global.type.Sentiment;
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
public class AiInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private InsightType type;

    private String title;
    private String content;

    @Enumerated(EnumType.STRING)
    private Sentiment sentiment;

    private Integer score;
    private LocalDateTime createdAt;
}
