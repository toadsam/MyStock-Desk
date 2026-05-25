package com.stockflow.earnings.dart;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DartFinancialSnapshot(
        String symbol,
        String companyName,
        Integer year,
        Integer quarter,
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
}
