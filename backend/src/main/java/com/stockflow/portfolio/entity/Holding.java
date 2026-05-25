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
public class Holding {

    private static final int MONEY_SCALE = 0;
    private static final int PRICE_SCALE = 2;
    private static final int RATE_SCALE = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long portfolioId;
    private Long stockId;
    private Integer quantity;
    private BigDecimal averagePrice;
    private BigDecimal currentPrice;
    private BigDecimal evaluationAmount;
    private BigDecimal profitLoss;
    private BigDecimal returnRate;
    private BigDecimal weight;

    public void buy(Integer buyQuantity, BigDecimal executionPrice) {
        BigDecimal previousCost = purchaseAmount();
        BigDecimal addedCost = executionPrice.multiply(BigDecimal.valueOf(buyQuantity));
        quantity += buyQuantity;
        averagePrice = previousCost.add(addedCost)
                .divide(BigDecimal.valueOf(quantity), PRICE_SCALE, RoundingMode.HALF_UP);
    }

    public void sell(Integer sellQuantity) {
        if (quantity < sellQuantity) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }
        quantity -= sellQuantity;
    }

    public boolean isEmpty() {
        return quantity == 0;
    }

    public BigDecimal purchaseAmount() {
        return averagePrice.multiply(BigDecimal.valueOf(quantity));
    }

    public void refresh(BigDecimal latestPrice, BigDecimal totalAsset) {
        currentPrice = latestPrice;
        evaluationAmount = latestPrice.multiply(BigDecimal.valueOf(quantity)).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal purchaseAmount = purchaseAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        profitLoss = evaluationAmount.subtract(purchaseAmount);
        returnRate = calculateRate(profitLoss, purchaseAmount);
        weight = calculateRate(evaluationAmount, totalAsset);
    }

    private BigDecimal calculateRate(BigDecimal numerator, BigDecimal denominator) {
        if (denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return numerator
                .multiply(BigDecimal.valueOf(100))
                .divide(denominator, RATE_SCALE, RoundingMode.HALF_UP);
    }
}
