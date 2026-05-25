package com.stockflow.transaction.entity;

import com.stockflow.global.type.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "investment_transaction")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private Long stockId;
    private String symbol;
    private String stockName;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    private Integer quantity;
    private BigDecimal price;
    private BigDecimal fee;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private BigDecimal realizedProfitLoss;
    private LocalDate transactionDate;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String memo;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String reason;

    private String tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void update(
            Long stockId,
            String symbol,
            String stockName,
            TransactionType transactionType,
            Integer quantity,
            BigDecimal price,
            BigDecimal fee,
            BigDecimal tax,
            BigDecimal totalAmount,
            BigDecimal realizedProfitLoss,
            LocalDate transactionDate,
            String memo,
            String reason,
            String tags
    ) {
        this.stockId = stockId;
        this.symbol = symbol;
        this.stockName = stockName;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.price = price;
        this.fee = fee;
        this.tax = tax;
        this.totalAmount = totalAmount;
        this.realizedProfitLoss = realizedProfitLoss;
        this.transactionDate = transactionDate;
        this.memo = memo;
        this.reason = reason;
        this.tags = tags;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateCalculatedAmounts(BigDecimal totalAmount, BigDecimal realizedProfitLoss) {
        this.totalAmount = totalAmount;
        this.realizedProfitLoss = realizedProfitLoss;
        this.updatedAt = LocalDateTime.now();
    }
}
