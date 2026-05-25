package com.stockflow.ai.service;

import com.stockflow.ai.dto.PortfolioReportDto;
import com.stockflow.earnings.service.EarningsService;
import com.stockflow.portfolio.dto.HoldingDto;
import com.stockflow.portfolio.dto.PortfolioStudyCandidateDto;
import com.stockflow.portfolio.service.PortfolioService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PortfolioReportService {

    private final PortfolioService portfolioService;
    private final EarningsService earningsService;

    public PortfolioReportDto latest() {
        List<HoldingDto> holdings = portfolioService.getHoldings();
        List<PortfolioStudyCandidateDto> candidates = portfolioService.getStudyCandidates();
        String topHolding = holdings.stream()
                .max(Comparator.comparing(HoldingDto::weight))
                .map(holding -> holding.stock().name() + " " + holding.weight() + "%")
                .orElse("보유 종목 없음");
        long lossCount = holdings.stream().filter(holding -> holding.profitLoss().signum() < 0).count();
        long profitCount = holdings.stream().filter(holding -> holding.profitLoss().signum() >= 0).count();
        return new PortfolioReportDto(
                LocalDateTime.now(),
                "현재 포트폴리오는 입력한 거래 기록과 보유 종목 기준으로 정리되었습니다. 가장 큰 비중은 " + topHolding + "입니다.",
                List.of(
                        "수익 종목은 " + profitCount + "개, 손실 종목은 " + lossCount + "개입니다.",
                        "최근 거래 기록의 투자 이유가 현재 뉴스와 실적 흐름에서 유지되는지 확인하세요."
                ),
                holdings.stream()
                        .filter(holding -> holding.weight().doubleValue() >= 15)
                        .map(holding -> holding.stock().name() + " 비중이 " + holding.weight() + "%입니다. 종목과 업종 쏠림을 점검하세요.")
                        .limit(4)
                        .toList(),
                earningsService.getCalendar().stream()
                        .filter(item -> item.daysUntil() >= 0 && item.daysUntil() <= 14)
                        .map(item -> item.companyName() + " 실적 발표 D-" + item.daysUntil())
                        .limit(4)
                        .toList(),
                List.of(
                        "최근 매수 이유가 한 문장으로 남아 있는지 확인하세요.",
                        "손실 종목은 처음 정한 리스크 기준이 깨졌는지 복기하세요.",
                        "실적 발표 전 매출 성장률과 영업이익률 변화를 같이 확인하세요."
                ),
                candidates.stream()
                        .map(candidate -> candidate.candidateName() + " · " + candidate.studyReason())
                        .limit(4)
                        .toList(),
                "이 리포트는 사용자의 투자 기록과 공개 정보를 바탕으로 정리한 참고 자료이며, 매수·매도 추천이나 투자 자문이 아닙니다."
        );
    }
}
