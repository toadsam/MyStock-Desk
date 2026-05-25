package com.stockflow.seed;

import com.stockflow.global.type.ImpactType;
import com.stockflow.global.type.InsightType;
import com.stockflow.global.type.OrderMethod;
import com.stockflow.global.type.OrderStatus;
import com.stockflow.global.type.OrderType;
import com.stockflow.global.type.SectorPerformanceType;
import com.stockflow.global.type.Sentiment;
import com.stockflow.global.type.TargetType;
import com.stockflow.market.entity.MarketIndex;
import com.stockflow.market.entity.PricePoint;
import com.stockflow.market.entity.SectorPerformance;
import com.stockflow.market.repository.MarketIndexRepository;
import com.stockflow.market.repository.PricePointRepository;
import com.stockflow.market.repository.SectorPerformanceRepository;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
import com.stockflow.news.entity.News;
import com.stockflow.news.repository.NewsRepository;
import com.stockflow.portfolio.entity.Holding;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.HoldingRepository;
import com.stockflow.portfolio.repository.PortfolioRepository;
import com.stockflow.research.entity.AiInsight;
import com.stockflow.research.repository.AiInsightRepository;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import com.stockflow.trade.entity.Execution;
import com.stockflow.trade.entity.TradeLedger;
import com.stockflow.trade.entity.TradeOrder;
import com.stockflow.trade.repository.ExecutionRepository;
import com.stockflow.trade.repository.TradeLedgerRepository;
import com.stockflow.trade.repository.TradeOrderRepository;
import com.stockflow.watchlist.entity.Watchlist;
import com.stockflow.watchlist.repository.WatchlistRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final StockRepository stockRepository;
    private final MarketIndexRepository marketIndexRepository;
    private final PricePointRepository pricePointRepository;
    private final WatchlistRepository watchlistRepository;
    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final TradeOrderRepository tradeOrderRepository;
    private final TradeLedgerRepository tradeLedgerRepository;
    private final ExecutionRepository executionRepository;
    private final NewsRepository newsRepository;
    private final AiInsightRepository aiInsightRepository;
    private final SectorPerformanceRepository sectorPerformanceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (memberRepository.count() > 0) {
            return;
        }

        Member member = memberRepository.save(Member.builder()
                .name("김투자")
                .email("investor@stockflow.com")
                .passwordHash(passwordEncoder.encode("stockflow1234"))
                .profileImageUrl("https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=80")
                .membershipGrade("VIP")
                .createdAt(LocalDateTime.now().minusMonths(16))
                .build());

        Map<String, Stock> stocks = seedStocks();
        seedMarketIndices();
        seedPricePoints();
        seedSectors();
        seedWatchlist(member.getId(), stocks);
        Portfolio portfolio = seedPortfolio(member.getId());
        seedHoldings(portfolio.getId(), stocks);
        seedOrdersAndExecutions(member.getId(), portfolio, stocks);
        seedNews();
        seedInsights();
    }

    private Map<String, Stock> seedStocks() {
        List<Stock> saved = stockRepository.saveAll(List.of(
                stock("005930", "삼성전자", "코스피", 78600, 77200, 1400, 1.82, 79200, 77100, 12_824_912L, 1_005_832_000_000L, "전기/전자", "반도체", 4_690_245_000_000_000L, 16.35, 1.34, 2.45, 86800, 63600),
                stock("000660", "SK하이닉스", "코스피", 196500, 190400, 6100, 3.21, 198200, 188100, 7_892_100L, 1_287_600_000_000L, "반도체", "메모리", 142_900_000_000_000L, 22.10, 1.82, 0.75, 212000, 111000),
                stock("035420", "NAVER", "코스피", 198300, 199800, -1500, -0.75, 201000, 196200, 2_345_900L, 654_300_000_000L, "인터넷", "플랫폼", 32_200_000_000_000L, 31.24, 1.19, 0.60, 242000, 172000),
                stock("035720", "카카오", "코스피", 45150, 45800, -650, -1.42, 46200, 44850, 4_231_200L, 234_100_000_000L, "인터넷", "플랫폼", 20_100_000_000_000L, 44.20, 1.26, 0.00, 61200, 37200),
                stock("373220", "LG에너지솔루션", "코스피", 347000, 339800, 7200, 2.11, 350500, 337000, 931_200L, 421_000_000_000L, "2차전지", "배터리", 81_200_000_000_000L, 63.18, 4.10, 0.00, 612000, 308000),
                stock("005380", "현대차", "코스피", 236500, 235000, 1500, 0.64, 239000, 233000, 1_382_000L, 398_700_000_000L, "자동차", "완성차", 49_900_000_000_000L, 5.68, 0.61, 4.25, 298000, 172000),
                stock("005490", "POSCO홀딩스", "코스피", 368000, 363100, 4900, 1.35, 373000, 360500, 821_000L, 211_200_000_000L, "철강", "소재", 31_200_000_000_000L, 10.12, 0.48, 2.20, 658000, 298000),
                stock("207940", "삼성바이오로직스", "코스피", 880000, 883000, -3000, -0.34, 889000, 871000, 203_100L, 276_500_000_000L, "바이오", "CDMO", 62_600_000_000_000L, 71.40, 5.72, 0.00, 982000, 698000),
                stock("010120", "LS ELECTRIC", "코스피", 130000, 124500, 5500, 4.42, 132700, 122000, 1_210_000L, 157_900_000_000L, "전기/전자", "전력기기", 3_900_000_000_000L, 18.20, 2.02, 1.10, 146000, 72000),
                stock("360750", "TIGER 미국S&P500", "ETF", 12650, 12480, 170, 1.36, 12720, 12380, 1_125_000L, 15_230_000_000L, "ETF", "해외지수", 1_180_000_000_000L, 0.00, 0.00, 0.45, 13210, 10420)
        ));
        return saved.stream().collect(Collectors.toMap(Stock::getSymbol, Function.identity()));
    }

    private Stock stock(
            String symbol,
            String name,
            String market,
            long currentPrice,
            long previousClose,
            long changePrice,
            double changeRate,
            long highPrice,
            long lowPrice,
            long volume,
            long tradingValue,
            String sector,
            String industry,
            long marketCap,
            double per,
            double pbr,
            double dividendYield,
            long week52High,
            long week52Low
    ) {
        return Stock.builder()
                .symbol(symbol)
                .name(name)
                .market(market)
                .currentPrice(bd(currentPrice))
                .previousClose(bd(previousClose))
                .changePrice(bd(changePrice))
                .changeRate(BigDecimal.valueOf(changeRate))
                .highPrice(bd(highPrice))
                .lowPrice(bd(lowPrice))
                .volume(volume)
                .tradingValue(bd(tradingValue))
                .sector(sector)
                .industry(industry)
                .marketCap(bd(marketCap))
                .per(BigDecimal.valueOf(per))
                .pbr(BigDecimal.valueOf(pbr))
                .dividendYield(BigDecimal.valueOf(dividendYield))
                .week52High(bd(week52High))
                .week52Low(bd(week52Low))
                .build();
    }

    private void seedMarketIndices() {
        marketIndexRepository.saveAll(List.of(
                marketIndex("코스피", "KOSPI", 2678.56, 28.51, 1.08, "STOCK", 1),
                marketIndex("코스닥", "KOSDAQ", 872.35, 9.12, 1.06, "STOCK", 2),
                marketIndex("나스닥", "NASDAQ", 16902.55, 201.21, 1.20, "GLOBAL", 3),
                marketIndex("S&P 500", "SP500", 5303.27, 27.74, 0.53, "GLOBAL", 4),
                marketIndex("원/달러", "USDKRW", 1357.80, -5.40, -0.40, "FX", 5),
                marketIndex("국고채 3년", "KTB3Y", 3.245, -0.028, -0.86, "BOND", 6)
        ));
    }

    private MarketIndex marketIndex(String name, String code, double value, double changeValue, double changeRate, String type, int order) {
        return MarketIndex.builder()
                .name(name)
                .code(code)
                .value(BigDecimal.valueOf(value))
                .changeValue(BigDecimal.valueOf(changeValue))
                .changeRate(BigDecimal.valueOf(changeRate))
                .type(type)
                .displayOrder(order)
                .build();
    }

    private void seedPricePoints() {
        seedSeries(TargetType.INDEX, "KOSPI", BigDecimal.valueOf(2598.00), 80, 1.06);
        seedSeries(TargetType.INDEX, "KOSDAQ", BigDecimal.valueOf(833.00), 75, 0.54);
        seedSeries(TargetType.INDEX, "NASDAQ", BigDecimal.valueOf(16540.00), 75, 4.45);
        seedSeries(TargetType.INDEX, "SP500", BigDecimal.valueOf(5220.00), 75, 1.12);
        seedSeries(TargetType.INDEX, "USDKRW", BigDecimal.valueOf(1374.00), 75, -0.21);
        seedSeries(TargetType.INDEX, "KTB3Y", BigDecimal.valueOf(3.36), 75, -0.003);
        seedSeries(TargetType.STOCK, "005930", BigDecimal.valueOf(77200), 82, 18.5);
        seedSeries(TargetType.STOCK, "000660", BigDecimal.valueOf(186000), 60, 36.0);
        seedSeries(TargetType.STOCK, "035420", BigDecimal.valueOf(203000), 60, -12.0);
    }

    private void seedSeries(TargetType targetType, String code, BigDecimal start, int count, double drift) {
        LocalDateTime baseTime = LocalDateTime.now().withHour(9).withMinute(0).withSecond(0).withNano(0);
        for (int i = 0; i < count; i++) {
            double wave = Math.sin(i / 5.5) * 6.2 + Math.cos(i / 9.0) * 3.8;
            BigDecimal price = start.add(BigDecimal.valueOf((drift * i) + wave).setScale(2, RoundingMode.HALF_UP));
            pricePointRepository.save(PricePoint.builder()
                    .targetType(targetType)
                    .targetCode(code)
                    .label(baseTime.plusMinutes(i * 5L).toLocalTime().toString().substring(0, 5))
                    .price(price)
                    .volume(700_000L + i * 12_300L + (i % 6) * 54_000L)
                    .createdAt(baseTime.plusMinutes(i * 5L))
                    .build());
        }
    }

    private void seedSectors() {
        sectorPerformanceRepository.saveAll(List.of(
                sector("철강", 2.35, 1, SectorPerformanceType.TOP),
                sector("반도체", 2.48, 2, SectorPerformanceType.TOP),
                sector("IT하드웨어", 1.97, 3, SectorPerformanceType.TOP),
                sector("전기/전자", 1.85, 4, SectorPerformanceType.TOP),
                sector("자동차", 1.56, 5, SectorPerformanceType.TOP),
                sector("보험", -0.12, 6, SectorPerformanceType.BOTTOM),
                sector("통신", -0.24, 7, SectorPerformanceType.BOTTOM),
                sector("유통", -0.15, 8, SectorPerformanceType.BOTTOM),
                sector("음식료품", -0.38, 9, SectorPerformanceType.BOTTOM),
                sector("2차전지", -0.78, 10, SectorPerformanceType.BOTTOM)
        ));
    }

    private SectorPerformance sector(String name, double changeRate, int rank, SectorPerformanceType type) {
        return SectorPerformance.builder()
                .sectorName(name)
                .changeRate(BigDecimal.valueOf(changeRate))
                .ranking(rank)
                .type(type)
                .build();
    }

    private void seedWatchlist(Long memberId, Map<String, Stock> stocks) {
        watchlistRepository.saveAll(List.of(
                watch(memberId, stocks.get("005930").getId(), 1),
                watch(memberId, stocks.get("000660").getId(), 2),
                watch(memberId, stocks.get("035420").getId(), 3),
                watch(memberId, stocks.get("035720").getId(), 4),
                watch(memberId, stocks.get("373220").getId(), 5)
        ));
    }

    private Watchlist watch(Long memberId, Long stockId, int daysAgo) {
        return Watchlist.builder()
                .memberId(memberId)
                .stockId(stockId)
                .createdAt(LocalDateTime.now().minusDays(daysAgo))
                .build();
    }

    private Portfolio seedPortfolio(Long memberId) {
        return portfolioRepository.save(Portfolio.builder()
                .memberId(memberId)
                .totalAsset(bd(153_780_350))
                .cash(bd(8_450_000))
                .totalPurchaseAmount(bd(98_765_000))
                .totalEvaluationAmount(bd(145_330_350))
                .totalProfitLoss(bd(29_465_500))
                .totalReturnRate(BigDecimal.valueOf(29.83))
                .dailyProfitLoss(bd(1_845_200))
                .dailyReturnRate(BigDecimal.valueOf(1.21))
                .build());
    }

    private void seedHoldings(Long portfolioId, Map<String, Stock> stocks) {
        holdingRepository.saveAll(List.of(
                holding(portfolioId, stocks.get("005930"), 200, 71250, 15_720_000, 1_470_000, 10.32, 10.22),
                holding(portfolioId, stocks.get("000660"), 100, 176000, 19_650_000, 2_050_000, 11.65, 12.77),
                holding(portfolioId, stocks.get("373220"), 80, 395000, 27_760_000, -3_840_000, -12.14, 18.03),
                holding(portfolioId, stocks.get("035420"), 50, 178000, 9_915_000, 1_015_000, 11.39, 6.44),
                holding(portfolioId, stocks.get("035720"), 120, 51000, 5_418_000, -702_000, -11.46, 3.52),
                holding(portfolioId, stocks.get("005380"), 60, 242000, 14_190_000, -330_000, -2.27, 9.21),
                holding(portfolioId, stocks.get("005490"), 35, 331000, 12_880_000, 1_295_000, 11.18, 8.37)
        ));
    }

    private Holding holding(
            Long portfolioId,
            Stock stock,
            int quantity,
            long averagePrice,
            long evaluationAmount,
            long profitLoss,
            double returnRate,
            double weight
    ) {
        return Holding.builder()
                .portfolioId(portfolioId)
                .stockId(stock.getId())
                .quantity(quantity)
                .averagePrice(bd(averagePrice))
                .currentPrice(stock.getCurrentPrice())
                .evaluationAmount(bd(evaluationAmount))
                .profitLoss(bd(profitLoss))
                .returnRate(BigDecimal.valueOf(returnRate))
                .weight(BigDecimal.valueOf(weight))
                .build();
    }

    private void seedOrdersAndExecutions(Long memberId, Portfolio portfolio, Map<String, Stock> stocks) {
        List<TradeOrder> orders = tradeOrderRepository.saveAll(List.of(
                order(memberId, stocks.get("005930"), OrderType.BUY, OrderMethod.LIMIT, 78200, 50, OrderStatus.COMPLETED, 2),
                order(memberId, stocks.get("360750"), OrderType.BUY, OrderMethod.LIMIT, 12480, 30, OrderStatus.COMPLETED, 3),
                order(memberId, stocks.get("035720"), OrderType.SELL, OrderMethod.LIMIT, 44800, 40, OrderStatus.COMPLETED, 4),
                order(memberId, stocks.get("035420"), OrderType.BUY, OrderMethod.LIMIT, 197500, 10, OrderStatus.PENDING, 5),
                order(memberId, stocks.get("000660"), OrderType.BUY, OrderMethod.MARKET, 196500, 1, OrderStatus.COMPLETED, 8),
                order(memberId, stocks.get("373220"), OrderType.SELL, OrderMethod.LIMIT, 347000, 10, OrderStatus.PENDING, 11),
                order(memberId, stocks.get("005380"), OrderType.BUY, OrderMethod.MARKET, 236500, 20, OrderStatus.COMPLETED, 13)
        ));

        orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.COMPLETED)
                .forEach(order -> {
                    LocalDateTime executedAt = order.getCreatedAt().plusSeconds(11);
                    executionRepository.save(Execution.builder()
                            .orderId(order.getId())
                            .stockId(order.getStockId())
                            .executionPrice(order.getOrderPrice())
                            .quantity(order.getQuantity())
                            .executedAt(executedAt)
                            .build());
                    tradeLedgerRepository.save(TradeLedger.builder()
                            .memberId(memberId)
                            .portfolioId(portfolio.getId())
                            .orderId(order.getId())
                            .stockId(order.getStockId())
                            .orderType(order.getOrderType())
                            .quantity(order.getQuantity())
                            .executionPrice(order.getOrderPrice())
                            .grossAmount(order.getEstimatedAmount())
                            .fee(order.getFee())
                            .netCashAmount(order.getOrderType() == OrderType.BUY
                                    ? order.getEstimatedAmount().add(order.getFee()).negate()
                                    : order.getEstimatedAmount().subtract(order.getFee()))
                            .realizedProfitLoss(order.getOrderType() == OrderType.SELL ? bd(88_000) : BigDecimal.ZERO)
                            .cashBalance(portfolio.getCash())
                            .totalAsset(portfolio.getTotalAsset())
                            .createdAt(executedAt)
                            .build());
                });
    }

    private TradeOrder order(
            Long memberId,
            Stock stock,
            OrderType orderType,
            OrderMethod method,
            long price,
            int quantity,
            OrderStatus status,
            int daysAgo
    ) {
        BigDecimal orderPrice = bd(price);
        BigDecimal estimated = orderPrice.multiply(BigDecimal.valueOf(quantity));
        return TradeOrder.builder()
                .memberId(memberId)
                .stockId(stock.getId())
                .orderType(orderType)
                .orderMethod(method)
                .orderPrice(orderPrice)
                .quantity(quantity)
                .estimatedAmount(estimated)
                .fee(estimated.multiply(new BigDecimal("0.00015")).setScale(0, RoundingMode.HALF_UP))
                .status(status)
                .createdAt(LocalDateTime.now().minusDays(daysAgo))
                .build();
    }

    private void seedNews() {
        LocalDateTime now = LocalDateTime.now();
        newsRepository.saveAll(List.of(
                news("삼성전자, HBM3E 12단 엔비디아 공급 본격화 전망", "고부가 메모리 공급 확대 기대가 반도체 업종 투자심리를 개선하고 있습니다.", "기업", "연합뉴스", ImpactType.POSITIVE, "005930", now.minusMinutes(18), 95),
                news("SK하이닉스, 1분기 영업이익 시장 예상 상회", "HBM 매출 비중 증가와 서버 수요 회복으로 실적 개선 기대가 커졌습니다.", "기업", "한국경제", ImpactType.POSITIVE, "000660", now.minusMinutes(31), 93),
                news("미 연준 인사들, 금리 인상 가능성 열어둬야 한다는 의견", "금리 경로 불확실성이 성장주 밸류에이션에 부담으로 작용할 수 있습니다.", "경제", "블룸버그", ImpactType.NEUTRAL, null, now.minusMinutes(46), 82),
                news("환율 1,351원으로 소폭 하락, 외국인 순매수 전환", "원화 강세와 반도체 대형주 수급 개선이 지수 반등에 기여했습니다.", "시장", "매일경제", ImpactType.POSITIVE, null, now.minusMinutes(57), 78),
                news("LG에너지솔루션, 4680 배터리 생산 일정 재점검", "투자 일정 조정 가능성이 제기되며 단기 변동성이 확대되고 있습니다.", "기업", "전자신문", ImpactType.NEGATIVE, "373220", now.minusHours(1), 74),
                news("NAVER, 광고 회복 지연 우려에 약세", "커머스 성장세는 유지되고 있으나 광고 매출 회복 속도는 시장 기대보다 느립니다.", "기업", "서울경제", ImpactType.NEGATIVE, "035420", now.minusHours(2), 68),
                news("현대차, 북미 전기차 판매 회복 기대", "신차 출시와 환율 효과로 하반기 실적 방어력이 주목됩니다.", "기업", "이데일리", ImpactType.POSITIVE, "005380", now.minusHours(3), 77),
                news("중국 4월 산업생산 전년비 6.7% 증가", "예상치를 웃돈 지표가 소재와 경기민감 업종에 긍정적으로 작용했습니다.", "글로벌", "로이터", ImpactType.POSITIVE, null, now.minusHours(4), 71),
                news("국제유가 상승세 지속, WTI 80달러 돌파", "원가 부담 우려가 커지며 일부 운송 및 화학 업종에는 부담이 될 수 있습니다.", "글로벌", "CNBC", ImpactType.NEGATIVE, null, now.minusHours(5), 69),
                news("카카오, 플랫폼 규제 논의 재부각", "정책 불확실성으로 단기 투자심리가 위축될 수 있습니다.", "기업", "머니투데이", ImpactType.NEGATIVE, "035720", now.minusHours(6), 66),
                news("POSCO홀딩스, 철강 가격 반등 수혜 전망", "중국 수요 개선과 원재료 가격 안정이 마진 회복에 기여할 수 있습니다.", "기업", "파이낸셜뉴스", ImpactType.POSITIVE, "005490", now.minusHours(7), 73),
                news("삼성바이오로직스, 신규 수주 모멘텀 부각", "CDMO 장기 계약 증가가 안정적 성장 전망을 뒷받침합니다.", "기업", "조선비즈", ImpactType.POSITIVE, "207940", now.minusHours(8), 70)
        ));
    }

    private News news(String title, String summary, String category, String source, ImpactType impactType, String symbol, LocalDateTime publishedAt, int score) {
        return News.builder()
                .title(title)
                .summary(summary)
                .category(category)
                .source(source)
                .impactType(impactType)
                .relatedStockSymbol(symbol)
                .publishedAt(publishedAt)
                .aiImportanceScore(score)
                .build();
    }

    private void seedInsights() {
        LocalDateTime now = LocalDateTime.now();
        aiInsightRepository.saveAll(List.of(
                insight(InsightType.HOME, "시장 강세 지속 전망", "AI 분석에 따르면 코스피는 2,700~2,750 구간에서 강세가 지속될 확률이 높습니다.", Sentiment.POSITIVE, 82, now.minusMinutes(10)),
                insight(InsightType.STOCK, "삼성전자 중장기 긍정", "메모리 반도체 업황 개선과 AI 수요 증가로 실적 회복이 기대됩니다. 단기 변동성은 관리가 필요합니다.", Sentiment.POSITIVE, 78, now.minusMinutes(12)),
                insight(InsightType.MARKET, "반도체 중심 수급 개선", "외국인 순매수가 이어지며 반도체, 금융, 자동차 강세가 두드러집니다.", Sentiment.POSITIVE, 81, now.minusMinutes(15)),
                insight(InsightType.PORTFOLIO, "리밸런싱 제안", "현재 포트폴리오는 전기전자 섹터 비중이 높습니다. 금융/헬스케어 섹터 비중을 5~10% 확대하는 방안을 검토하세요.", Sentiment.NEUTRAL, 76, now.minusMinutes(20)),
                insight(InsightType.RESEARCH, "반도체 업황 개선 신호 감지", "HBM 공급 확대와 클라우드 투자 회복이 반도체 밸류체인에 우호적입니다.", Sentiment.POSITIVE, 92, now.minusMinutes(22)),
                insight(InsightType.RESEARCH, "2차전지 단기 조정 가능성", "유럽 전기차 수요 둔화와 원자재 가격 변동성이 단기 부담 요인입니다.", Sentiment.NEGATIVE, 78, now.minusMinutes(25)),
                insight(InsightType.RESEARCH, "바이오 기술 수출 모멘텀 지속", "국내 바이오 기업들의 기술 수출 계약이 증가하며 중장기 성장 기대가 유지됩니다.", Sentiment.POSITIVE, 85, now.minusMinutes(27)),
                insight(InsightType.RISK, "미 경기침체 우려 심화", "소비 지표 둔화와 고금리 장기화 가능성으로 성장주 변동성이 커질 수 있습니다.", Sentiment.NEGATIVE, 65, now.minusMinutes(30)),
                insight(InsightType.RISK, "글로벌 지정학적 리스크", "유가와 환율 변동성이 확대되며 수입 원가 부담이 커질 수 있습니다.", Sentiment.NEGATIVE, 48, now.minusMinutes(33)),
                insight(InsightType.RISK, "원자재 가격 변동성 확대", "구리와 원유 가격 급등락이 산업재와 2차전지 업종 실적에 영향을 줄 수 있습니다.", Sentiment.NEGATIVE, 46, now.minusMinutes(36))
        ));
    }

    private AiInsight insight(InsightType type, String title, String content, Sentiment sentiment, int score, LocalDateTime createdAt) {
        return AiInsight.builder()
                .type(type)
                .title(title)
                .content(content)
                .sentiment(sentiment)
                .score(score)
                .createdAt(createdAt)
                .build();
    }

    private BigDecimal bd(long value) {
        return BigDecimal.valueOf(value);
    }
}
