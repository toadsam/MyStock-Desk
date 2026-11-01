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
            throw new IllegalArgumentException("사용 가능한 현금이 부족합니다.");
        }
        cash = cash.subtract(amount);
    }

    public void deposit(BigDecimal amount) {
        cash = cash.add(amount);
    }

    /**
     * 직접 적은 매매 기록을 재생할 때 쓰는 출금. 입금 기록 없이 매수만 적은 사람이 대부분이라
     * 현금이 모자라도 막지 않는다. 모자란 만큼은 적지 않은 입금이 그때 있었다고 보고 예수금을 0 에 둔다.
     */
    public void spend(BigDecimal amount) {
        cash = cash.subtract(amount).max(BigDecimal.ZERO);
    }

    public void resetForRecordRecalculation(BigDecimal cash) {
        this.cash = cash.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        this.totalAsset = this.cash;
        this.totalPurchaseAmount = BigDecimal.ZERO;
        this.totalEvaluationAmount = BigDecimal.ZERO;
        this.totalProfitLoss = BigDecimal.ZERO;
        this.totalReturnRate = BigDecimal.ZERO;
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
