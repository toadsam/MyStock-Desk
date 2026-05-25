package com.stockflow.earnings.dto;

import com.stockflow.earnings.entity.Earnings;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record EarningsDto(
        Long id,
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
        boolean estimated,
        String source,
        LocalDateTime lastUpdatedAt
) {
    public static EarningsDto from(Earnings earnings) {
        return new EarningsDto(
                earnings.getId(),
                earnings.getSymbol(),
                earnings.getCompanyName(),
                earnings.getYear(),
                earnings.getQuarter(),
                earnings.getRevenue(),
                earnings.getOperatingProfit(),
                earnings.getNetIncome(),
                earnings.getOperatingMargin(),
                earnings.getYoyRevenueGrowth(),
                earnings.getYoyOperatingProfitGrowth(),
                earnings.getAnnouncementDate(),
                earnings.isEstimated(),
                earnings.getSource(),
                earnings.getLastUpdatedAt()
        );
    }
}
