package com.stockflow.earnings.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.LocalDate;
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
public class Earnings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String symbol;
    private String companyName;
    @Column(name = "fiscal_year")
    private Integer year;

    @Column(name = "fiscal_quarter")
    private Integer quarter;
    private BigDecimal revenue;
    private BigDecimal operatingProfit;
    private BigDecimal netIncome;
    private BigDecimal operatingMargin;
    private BigDecimal yoyRevenueGrowth;
    private BigDecimal yoyOperatingProfitGrowth;
    private LocalDate announcementDate;
    private boolean estimated;
    private String source;
    private LocalDateTime lastUpdatedAt;

    public void updateActualData(
            BigDecimal revenue,
            BigDecimal operatingProfit,
            BigDecimal netIncome,
            BigDecimal operatingMargin,
            BigDecimal yoyRevenueGrowth,
            BigDecimal yoyOperatingProfitGrowth,
            LocalDate announcementDate,
            String source,
            LocalDateTime lastUpdatedAt
    ) {
        this.revenue = revenue;
        this.operatingProfit = operatingProfit;
        this.netIncome = netIncome;
        this.operatingMargin = operatingMargin;
        this.yoyRevenueGrowth = yoyRevenueGrowth;
        this.yoyOperatingProfitGrowth = yoyOperatingProfitGrowth;
        this.announcementDate = announcementDate;
        this.estimated = false;
        this.source = source;
        this.lastUpdatedAt = lastUpdatedAt;
    }
}
