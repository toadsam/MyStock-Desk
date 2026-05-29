package com.stockflow.news.service;

import com.stockflow.global.type.ImpactType;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.news.entity.News;
import com.stockflow.news.repository.NewsRepository;
import com.stockflow.stock.repository.StockRepository;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;
    private final StockRepository stockRepository;
    private final GoogleNewsRssProvider googleNewsRssProvider;

    @Value("${stockflow.news.seed-fallback.enabled:false}")
    private boolean seedFallbackEnabled;

    public List<NewsDto> getNews(String category, ImpactType impactType, String symbol) {
        List<NewsDto> stored = seedFallbackEnabled
                ? newsRepository.findAllByOrderByPublishedAtDesc().stream()
                        .filter(news -> !StringUtils.hasText(category) || news.getCategory().equalsIgnoreCase(category))
                        .filter(news -> impactType == null || news.getImpactType() == impactType)
                        .filter(news -> !StringUtils.hasText(symbol) || symbol.equals(news.getRelatedStockSymbol()))
                        .map(NewsDto::from)
                        .toList()
                : List.of();
        List<NewsDto> live = liveNewsForSymbol(symbol, 8).stream()
                .filter(news -> impactType == null || news.impactType() == impactType)
                .toList();
        return merge(live, stored, 24);
    }

    public List<NewsDto> getBriefing() {
        List<NewsDto> live = googleNewsRssProvider.search("국내 증시 실적 반도체 AI 수익", null, 6);
        return merge(live, storedNewsByPublishedAt(), 6);
    }

    public List<NewsDto> getResearchNews() {
        List<NewsDto> live = googleNewsRssProvider.search("주식시장 실적 공시 업종 리스크", null, 8);
        List<NewsDto> stored = seedFallbackEnabled
                ? newsRepository.findAllByOrderByPublishedAtDesc().stream()
                        .sorted(Comparator.comparing(News::getAiImportanceScore).reversed())
                        .map(NewsDto::from)
                        .toList()
                : List.of();
        return merge(live, stored, 8);
    }

    public List<NewsDto> getStockNews(String symbol) {
        List<NewsDto> stored = seedFallbackEnabled
                ? newsRepository.findByRelatedStockSymbolOrderByPublishedAtDesc(symbol).stream()
                        .map(NewsDto::from)
                        .toList()
                : List.of();
        return merge(liveNewsForSymbol(symbol, 8), stored, 12);
    }

    private List<NewsDto> liveNewsForSymbol(String symbol, int limit) {
        if (!StringUtils.hasText(symbol)) {
            return List.of();
        }
        return stockRepository.findBySymbol(symbol)
                .map(stock -> googleNewsRssProvider.search(stock.getName() + " " + stock.getSymbol() + " 실적 공시 주가", symbol, limit))
                .orElseGet(List::of);
    }

    private List<NewsDto> storedNewsByPublishedAt() {
        if (!seedFallbackEnabled) {
            return List.of();
        }
        return newsRepository.findAllByOrderByPublishedAtDesc().stream()
                .map(NewsDto::from)
                .toList();
    }

    private List<NewsDto> merge(List<NewsDto> live, List<NewsDto> stored, int limit) {
        Map<String, NewsDto> byTitle = new LinkedHashMap<>();
        live.forEach(news -> byTitle.putIfAbsent(news.title(), news));
        stored.forEach(news -> byTitle.putIfAbsent(news.title(), news));
        return byTitle.values().stream()
                .limit(limit)
                .toList();
    }
}
