package com.stockflow.news.service;

import com.stockflow.global.type.ImpactType;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.news.entity.News;
import com.stockflow.news.repository.NewsRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;

    public List<NewsDto> getNews(String category, ImpactType impactType, String symbol) {
        return newsRepository.findAllByOrderByPublishedAtDesc().stream()
                .filter(news -> !StringUtils.hasText(category) || news.getCategory().equalsIgnoreCase(category))
                .filter(news -> impactType == null || news.getImpactType() == impactType)
                .filter(news -> !StringUtils.hasText(symbol) || symbol.equals(news.getRelatedStockSymbol()))
                .map(NewsDto::from)
                .toList();
    }

    public List<NewsDto> getBriefing() {
        return newsRepository.findAllByOrderByPublishedAtDesc().stream()
                .limit(6)
                .map(NewsDto::from)
                .toList();
    }

    public List<NewsDto> getResearchNews() {
        return newsRepository.findAllByOrderByPublishedAtDesc().stream()
                .sorted(Comparator.comparing(News::getAiImportanceScore).reversed())
                .limit(8)
                .map(NewsDto::from)
                .toList();
    }
}
