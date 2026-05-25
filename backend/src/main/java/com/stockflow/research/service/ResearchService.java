package com.stockflow.research.service;

import com.stockflow.global.type.ImpactType;
import com.stockflow.global.type.InsightType;
import com.stockflow.market.dto.MarketIndexDto;
import com.stockflow.market.repository.MarketIndexRepository;
import com.stockflow.news.entity.News;
import com.stockflow.news.repository.NewsRepository;
import com.stockflow.research.dto.AiInsightDto;
import com.stockflow.research.dto.PortfolioImpactDto;
import com.stockflow.research.dto.ResearchBriefingDto;
import com.stockflow.research.dto.RiskDto;
import com.stockflow.research.dto.SentimentDto;
import com.stockflow.research.dto.StudyCandidateDto;
import com.stockflow.research.repository.AiInsightRepository;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResearchService {

    private final AiInsightRepository aiInsightRepository;
    private final MarketIndexRepository marketIndexRepository;
    private final NewsRepository newsRepository;
    private final StockRepository stockRepository;

    public ResearchBriefingDto getBriefing() {
        List<MarketIndexDto> snapshots = marketIndexRepository.findAllByOrderByDisplayOrderAsc().stream()
                .limit(3)
                .map(MarketIndexDto::from)
                .toList();
        List<AiInsightDto> insights = aiInsightRepository.findByTypeOrderByCreatedAtDesc(InsightType.RESEARCH)
                .stream()
                .map(AiInsightDto::from)
                .toList();
        return new ResearchBriefingDto(
                "김투자 님, 좋은 아침입니다.",
                "오늘 시장은 혼조세를 보일 것으로 예상됩니다. 반도체와 AI 인프라 업종의 수급 개선을 주시하세요.",
                LocalDateTime.of(2024, 5, 16, 8, 30),
                snapshots,
                List.of(
                        "AI 반도체 수요 강세 지속",
                        "미국 CPI 둔화로 금리 기대감 확대",
                        "환율 변동성 확대에 따른 대형주 수급 점검",
                        "2차전지 섹터는 실적 확인 전까지 변동성 관리 필요"
                ),
                insights
        );
    }

    public SentimentDto getSentiment() {
        List<News> news = newsRepository.findAll();
        int positive = (int) news.stream().filter(item -> item.getImpactType() == ImpactType.POSITIVE).count();
        int negative = (int) news.stream().filter(item -> item.getImpactType() == ImpactType.NEGATIVE).count();
        int neutral = news.size() - positive - negative;
        return new SentimentDto(positive * 138 + 1, negative * 87 + 12, neutral * 71 + 10, 2300, 0.32);
    }

    public List<RiskDto> getRisks() {
        return aiInsightRepository.findByTypeOrderByCreatedAtDesc(InsightType.RISK).stream()
                .map(insight -> new RiskDto(insight.getTitle(), insight.getContent(), insight.getScore()))
                .toList();
    }

    public List<StudyCandidateDto> getStudyCandidates() {
        return List.of(
                studyCandidate("000660", "RELATED_THEME", BigDecimal.valueOf(86), "HBM과 AI GPU 공급망 관련 뉴스가 반복되어 확인할 후보입니다.",
                        List.of("HBM 매출 비중", "공급 계약 뉴스", "영업이익률 변화"), "반도체 비중이 이미 높다면 포트폴리오 쏠림을 확인하세요."),
                studyCandidate("005930", "SUPPLY_CHAIN", BigDecimal.valueOf(78), "메모리와 파운드리 양쪽에서 AI 반도체 흐름을 확인할 후보입니다.",
                        List.of("HBM 수율", "메모리 가격", "파운드리 가동률"), "대형 복합 기업이라 특정 테마 영향이 희석될 수 있습니다."),
                studyCandidate("005380", "DIVERSIFICATION", BigDecimal.valueOf(62), "반도체 외 업종 분산 관점에서 자동차 업황과 환율 영향을 확인할 후보입니다.",
                        List.of("판매량", "환율 영향", "영업이익률"), "업종 분산 후보일 뿐 매수 판단은 별도 검토가 필요합니다."),
                studyCandidate("010120", "SUPPLY_CHAIN", BigDecimal.valueOf(74), "AI 데이터센터 전력 인프라 확대와 연결해 공부할 후보입니다.",
                        List.of("전력기기 수주", "북미 매출", "원자재 비용"), "수주 기대가 가격에 먼저 반영됐는지 확인하세요.")
        );
    }

    public List<PortfolioImpactDto> getPortfolioImpact() {
        return newsRepository.findAllByOrderByPublishedAtDesc().stream()
                .filter(news -> news.getRelatedStockSymbol() != null)
                .limit(5)
                .map(news -> new PortfolioImpactDto(
                        news.getTitle(),
                        news.getRelatedStockSymbol(),
                        impactValue(news.getImpactType()),
                        news.getImpactType() == ImpactType.POSITIVE ? "수혜 가능" :
                                news.getImpactType() == ImpactType.NEGATIVE ? "리스크 점검" : "중립"
                ))
                .toList();
    }

    private StudyCandidateDto studyCandidate(String symbol, String relationType, BigDecimal relevanceScore, String studyReason,
                                             List<String> checkPoints, String riskNote) {
        Stock stock = stockRepository.findBySymbol(symbol)
                .orElseGet(() -> Stock.builder()
                        .symbol(symbol)
                        .name("LS ELECTRIC")
                        .build());
        return new StudyCandidateDto(
                stock.getSymbol(),
                stock.getName(),
                stock.getIndustry(),
                relationType,
                studyReason,
                checkPoints,
                relevanceScore,
                riskNote,
                "seed/portfolio/news-check"
        );
    }

    private BigDecimal impactValue(ImpactType impactType) {
        return switch (impactType) {
            case POSITIVE -> BigDecimal.valueOf(1.78);
            case NEGATIVE -> BigDecimal.valueOf(-0.56);
            case NEUTRAL -> BigDecimal.valueOf(0.31);
        };
    }
}
