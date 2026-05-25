package com.stockflow.earnings.dto;

import com.stockflow.earnings.entity.Earnings;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

public record EarningsCalendarDto(
        Long id,
        String symbol,
        String companyName,
        LocalDate announcementDate,
        long daysUntil,
        boolean estimated,
        String relationType,
        List<String> checklist,
        String reviewQuestion,
        String source,
        LocalDateTime lastUpdatedAt
) {
    public static EarningsCalendarDto of(Earnings earnings, String relationType) {
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), earnings.getAnnouncementDate());
        return new EarningsCalendarDto(
                earnings.getId(),
                earnings.getSymbol(),
                earnings.getCompanyName(),
                earnings.getAnnouncementDate(),
                daysUntil,
                earnings.isEstimated(),
                relationType,
                List.of("매출 성장률", "영업이익률 변화", "기존 투자 이유 유지 여부", "업황 관련 코멘트", "환율/원자재/수요 변화 영향"),
                "실적 발표 후 내 투자 이유가 유지되는지 한 문장으로 복기해보세요.",
                earnings.getSource(),
                earnings.getLastUpdatedAt()
        );
    }
}
