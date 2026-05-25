package com.stockflow.portfolio.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.math.RoundingMode;
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

    private static final int MONEY_SCALE = 0;
    private static final int RATE_SCALE = 2;

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

    public void withdraw(BigDecimal amount) {
        if (cash.compareTo(amount) < 0) {
            throw new IllegalArgumentException("주문 가능 금액이 부족합니다.");
        }
        cash = cash.subtract(amount);
    }

    public void deposit(BigDecimal amount) {
        cash = cash.add(amount);
    }

    public void refreshTotals(BigDecimal totalPurchaseAmount, BigDecimal totalEvaluationAmount) {
        this.totalPurchaseAmount = totalPurchaseAmount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        this.totalEvaluationAmount = totalEvaluationAmount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        this.totalProfitLoss = this.totalEvaluationAmount.subtract(this.totalPurchaseAmount);
        this.totalReturnRate = calculateRate(this.totalProfitLoss, this.totalPurchaseAmount);
        this.totalAsset = cash.add(this.totalEvaluationAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateRate(BigDecimal profitLoss, BigDecimal purchaseAmount) {
        if (purchaseAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return profitLoss
                .multiply(BigDecimal.valueOf(100))
                .divide(purchaseAmount, RATE_SCALE, RoundingMode.HALF_UP);
    }
}
