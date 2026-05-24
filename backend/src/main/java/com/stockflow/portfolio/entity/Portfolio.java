package com.stockflow.portfolio.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private BigDecimal totalAsset;
    private BigDecimal cash;
    private BigDecimal totalPurchaseAmount;
    private BigDecimal totalEvaluationAmount;
    private BigDecimal totalProfitLoss;
    private BigDecimal totalReturnRate;
    private BigDecimal dailyProfitLoss;
    private BigDecimal dailyReturnRate;
}
