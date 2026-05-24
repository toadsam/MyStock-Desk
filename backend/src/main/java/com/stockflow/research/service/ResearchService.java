package com.stockflow.research.service;

import com.stockflow.global.type.ImpactType;
import com.stockflow.global.type.InsightType;
import com.stockflow.market.dto.MarketIndexDto;
import com.stockflow.market.repository.MarketIndexRepository;
import com.stockflow.news.entity.News;
import com.stockflow.news.repository.NewsRepository;
import com.stockflow.research.dto.AiInsightDto;
import com.stockflow.research.dto.PortfolioImpactDto;
import com.stockflow.research.dto.RecommendationDto;
import com.stockflow.research.dto.ResearchBriefingDto;
import com.stockflow.research.dto.RiskDto;
import com.stockflow.research.dto.SentimentDto;
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

    public List<RecommendationDto> getRecommendations() {
        return List.of(
                recommendation("000660", BigDecimal.valueOf(240000), BigDecimal.valueOf(22.1), "HBM 수요 증가 수혜"),
                recommendation("005930", BigDecimal.valueOf(92000), BigDecimal.valueOf(17.0), "온디바이스 AI 수혜 전망"),
                recommendation("005380", BigDecimal.valueOf(280000), BigDecimal.valueOf(18.4), "전기차 판매 회복 기대"),
                recommendation("010120", BigDecimal.valueOf(130000), BigDecimal.valueOf(24.0), "전력 인프라 투자 확대")
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

    private RecommendationDto recommendation(String symbol, BigDecimal targetPrice, BigDecimal upside, String reason) {
        Stock stock = stockRepository.findBySymbol(symbol)
                .orElseGet(() -> Stock.builder()
                        .symbol(symbol)
                        .name("LS ELECTRIC")
                        .build());
        return new RecommendationDto(stock.getSymbol(), stock.getName(), targetPrice, upside, reason);
    }

    private BigDecimal impactValue(ImpactType impactType) {
        return switch (impactType) {
            case POSITIVE -> BigDecimal.valueOf(1.78);
            case NEGATIVE -> BigDecimal.valueOf(-0.56);
            case NEUTRAL -> BigDecimal.valueOf(0.31);
        };
    }
}
