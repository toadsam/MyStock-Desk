package com.stockflow.company.service;

import com.stockflow.company.dto.CompanyAnalysisDto;
import com.stockflow.company.dto.CompanyMetricDto;
import com.stockflow.company.dto.CompanyPerformancePointDto;
import com.stockflow.earnings.entity.Earnings;
import com.stockflow.earnings.repository.EarningsRepository;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.service.StockService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 기업 상세 한 장.
 *
 * <p>지표는 종목 테이블(PER, PBR, 배당수익률)과 실적 테이블(분기 매출·영업이익 증감, 영업이익률)에 있는 값만 쓴다.
 * 없으면 그 칸을 비우지, 다른 회사 숫자나 예시 숫자로 채우지 않는다. 예전에는 삼성전자가 아니면 전부
 * 같은 고정 숫자(사실상 애플의 것)를 돌려주고 있었다.
 *
 * <p>요약 문장은 규칙으로 만들고 있었던 숫자만 말한다. "기대", "전망", "리스크" 같은 앞날 이야기는 쓰지 않는다.
 * 이 화면에서 앞날을 말하는 순간 투자 의견이 된다. 출처는 응답에 실어 화면이 그대로 보여 준다.
 */
@Service
@RequiredArgsConstructor
public class CompanyAnalysisService {

    private static final BigDecimal TRILLION = BigDecimal.valueOf(1_000_000_000_000L);
    private static final BigDecimal BILLION = BigDecimal.valueOf(1_000_000_000L);

    private final StockService stockService;
    private final EarningsRepository earningsRepository;

    public CompanyAnalysisDto analyze(String symbol) {
        StockDto stock = stockService.getStock(symbol);
        List<Earnings> history = earningsRepository.findBySymbolOrderByYearDescQuarterDesc(stock.symbol());
        Earnings latest = history.isEmpty() ? null : history.get(0);

        List<CompanyMetricDto> metrics = new ArrayList<>();
        if (latest != null) {
            String period = periodLabel(latest);
            addMetric(metrics, "매출 증감", latest.getYoyRevenueGrowth(), "%", signTone(latest.getYoyRevenueGrowth()), "전년 같은 분기 대비 · " + period);
            addMetric(metrics, "영업이익 증감", latest.getYoyOperatingProfitGrowth(), "%", signTone(latest.getYoyOperatingProfitGrowth()), "전년 같은 분기 대비 · " + period);
            addMetric(metrics, "영업이익률", latest.getOperatingMargin(), "%", "blue", period);
        }
        addMetric(metrics, "PER", stock.per(), "배", "blue", "주가 ÷ 주당순이익");
        addMetric(metrics, "PBR", stock.pbr(), "배", "blue", "주가 ÷ 주당순자산");
        boolean dividendAvailable = stock.dividendYield() != null && stock.dividendYield().signum() > 0;
        if (dividendAvailable) {
            metrics.add(new CompanyMetricDto("배당수익률", stock.dividendYield(), "%", "violet", "연 배당 ÷ 주가"));
        }

        boolean dollar = isDollarMarket(stock.market());
        BigDecimal divisor = dollar ? BILLION : TRILLION;
        List<CompanyPerformancePointDto> performance = history.stream()
                .sorted(Comparator.comparing(Earnings::getYear).thenComparing(Earnings::getQuarter))
                .map(earnings -> new CompanyPerformancePointDto(
                        periodLabel(earnings),
                        scaled(earnings.getRevenue(), divisor),
                        scaled(earnings.getOperatingProfit(), divisor)))
                .toList();

        String source = latest == null ? "stock-seed" : latest.getSource();
        boolean demo = source == null || source.startsWith("demo") || source.endsWith("-seed");
        String sourceLabel = demo ? "예시 데이터 · 공시 연동 전" : source;

        return new CompanyAnalysisDto(
                stock,
                metrics,
                performance,
                dollar ? "십억 달러" : "조원",
                summarize(stock, latest),
                latest == null ? null : periodLabel(latest),
                source,
                sourceLabel,
                latest != null && latest.isEstimated(),
                dividendAvailable
        );
    }

    private String summarize(StockDto stock, Earnings latest) {
        List<String> parts = new ArrayList<>();
        if (latest == null) {
            parts.add("아직 모인 실적 자료가 없어요. 시세와 PER, PBR만 보여 드려요.");
        } else {
            parts.add(periodLabel(latest) + " 기준 매출은 전년 같은 분기보다 " + direction(latest.getYoyRevenueGrowth())
                    + "고, 영업이익은 " + direction(latest.getYoyOperatingProfitGrowth()) + "어요.");
            if (latest.getOperatingMargin() != null) {
                parts.add("영업이익률은 " + rate(latest.getOperatingMargin()) + "%예요.");
            }
            if (latest.isEstimated()) {
                parts.add("이 분기 숫자는 추정치예요.");
            }
        }
        if (stock.dividendYield() != null && stock.dividendYield().signum() > 0) {
            parts.add("배당수익률은 " + rate(stock.dividendYield()) + "%예요.");
        }
        parts.add("지난 숫자를 정리한 것이고, 앞으로 오를지 내릴지는 말하지 않아요.");
        return String.join(" ", parts);
    }

    /** "12.4% 늘었" / "5.2% 줄었" / "그대로였" / "자료가 없". 뒤에 "고" 또는 "어요"가 붙는다. */
    private String direction(BigDecimal change) {
        if (change == null) {
            return "자료가 없";
        }
        int sign = change.signum();
        if (sign == 0) {
            return "그대로였";
        }
        return rate(change.abs()) + "% " + (sign > 0 ? "늘었" : "줄었");
    }

    private void addMetric(List<CompanyMetricDto> metrics, String label, BigDecimal value, String unit, String tone, String description) {
        if (value == null) {
            return;
        }
        metrics.add(new CompanyMetricDto(label, value, unit, tone, description));
    }

    private String signTone(BigDecimal value) {
        return value != null && value.signum() < 0 ? "orange" : "green";
    }

    private String periodLabel(Earnings earnings) {
        return earnings.getYear() + "년 " + earnings.getQuarter() + "분기";
    }

    private BigDecimal scaled(BigDecimal value, BigDecimal divisor) {
        return value == null ? null : value.divide(divisor, 1, RoundingMode.HALF_UP);
    }

    private String rate(BigDecimal value) {
        return value.setScale(1, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    private boolean isDollarMarket(String market) {
        if (market == null) {
            return false;
        }
        String upper = market.toUpperCase();
        return upper.contains("NASDAQ") || upper.contains("NYSE");
    }
}
