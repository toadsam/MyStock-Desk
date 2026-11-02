package com.stockflow.company.dto;

import com.stockflow.stock.dto.StockDto;
import java.util.List;

/**
 * 기업 상세 한 장. 숫자는 종목·실적 테이블에 있는 것만 담고, 어디서 왔는지(source)를 같이 보낸다.
 *
 * @param summary         규칙으로 만든 한 줄 정리. 있었던 숫자만 말하고 전망은 없다.
 * @param period          지표의 기준 분기. 실적 자료가 없으면 null.
 * @param source          원본 식별자. 예시 데이터면 demo- 로 시작한다.
 * @param sourceLabel     화면에 그대로 보여 줄 출처 문구.
 * @param estimated       기준 분기 숫자가 추정치인지.
 * @param performanceUnit 실적 추이의 단위(조원, 십억 달러).
 */
public record CompanyAnalysisDto(
        StockDto stock,
        List<CompanyMetricDto> metrics,
        List<CompanyPerformancePointDto> performance,
        String performanceUnit,
        String summary,
        String period,
        String source,
        String sourceLabel,
        boolean estimated,
        boolean dividendAvailable
) {
}
