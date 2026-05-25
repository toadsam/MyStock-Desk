package com.stockflow.trade.entity;

import com.stockflow.global.type.OrderType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
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
@Deprecated(since = "transaction-records")
public class TradeLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private Long portfolioId;
    private Long orderId;
    private Long stockId;

    @Enumerated(EnumType.STRING)
    private OrderType orderType;

    private Integer quantity;
    private BigDecimal executionPrice;
    private BigDecimal grossAmount;
    private BigDecimal fee;
    private BigDecimal netCashAmount;
    private BigDecimal realizedProfitLoss;
    private BigDecimal cashBalance;
    private BigDecimal totalAsset;
    private LocalDateTime createdAt;
}
