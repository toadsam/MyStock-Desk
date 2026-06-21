package com.stockflow.company.service;

import com.stockflow.company.dto.CompanyAnalysisDto;
import com.stockflow.company.dto.CompanyMetricDto;
import com.stockflow.company.dto.CompanyPerformancePointDto;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.service.StockService;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CompanyAnalysisService {

    private final StockService stockService;

    public CompanyAnalysisDto analyze(String symbol) {
        StockDto stock = stockService.getStock(symbol);
        boolean samsung = "005930".equals(stock.symbol());
        List<CompanyMetricDto> metrics = List.of(
                new CompanyMetricDto("매출 증가", BigDecimal.valueOf(samsung ? 15.4 : 8.7), "%", "green", "전년 대비 매출 성장"),
                new CompanyMetricDto("영업이익 변동", BigDecimal.valueOf(samsung ? -5.2 : 12.3), "%", samsung ? "orange" : "green", "수익성 변동"),
                new CompanyMetricDto("부채비율 안정", BigDecimal.valueOf(samsung ? 39.8 : 62.1), "%", "green", "재무 안정성"),
                new CompanyMetricDto("현금흐름 양호", BigDecimal.valueOf(samsung ? 12.8 : 96.9), samsung ? "조원" : "B USD", "blue", "FCF 기준"),
                new CompanyMetricDto("배당 있음", stock.dividendYield() == null ? BigDecimal.valueOf(2.1) : stock.dividendYield(), "%", "violet", "배당 수익률")
        );
        List<CompanyPerformancePointDto> performance = samsung
                ? List.of(
                new CompanyPerformancePointDto("2020", BigDecimal.valueOf(236.8), BigDecimal.valueOf(35.9)),
                new CompanyPerformancePointDto("2021", BigDecimal.valueOf(279.6), BigDecimal.valueOf(51.6)),
                new CompanyPerformancePointDto("2022", BigDecimal.valueOf(302.2), BigDecimal.valueOf(43.4)),
                new CompanyPerformancePointDto("2023", BigDecimal.valueOf(258.9), BigDecimal.valueOf(6.6)),
                new CompanyPerformancePointDto("2024", BigDecimal.valueOf(298.1), BigDecimal.valueOf(32.7))
        )
                : List.of(
                new CompanyPerformancePointDto("2020", BigDecimal.valueOf(274.5), BigDecimal.valueOf(66.3)),
                new CompanyPerformancePointDto("2021", BigDecimal.valueOf(365.8), BigDecimal.valueOf(108.9)),
                new CompanyPerformancePointDto("2022", BigDecimal.valueOf(394.3), BigDecimal.valueOf(119.4)),
                new CompanyPerformancePointDto("2023", BigDecimal.valueOf(383.3), BigDecimal.valueOf(114.3)),
                new CompanyPerformancePointDto("2024", BigDecimal.valueOf(391.0), BigDecimal.valueOf(123.2))
        );
        String summary = samsung
                ? "재무 안정성은 높은 편이지만 최근 수익성은 확인이 필요합니다. 메모리 업황 회복과 AI 수요 증가로 실적 개선이 기대되지만, 반도체 경쟁 심화 리스크도 함께 봐야 합니다."
                : "브랜드 충성도와 현금흐름은 강하지만 성장률 둔화와 규제 리스크를 함께 확인해야 합니다. 장기 보유 관점에서는 실적 추이와 주주환원 정책을 같이 보는 것이 좋습니다.";
        return new CompanyAnalysisDto(
                stock,
                metrics,
                performance,
                summary,
                "현재 포트폴리오에서 이 종목은 변동성과 성장 노출도를 높이는 역할을 합니다.",
                true
        );
    }
}
