package com.stockflow.coach.news;

import com.stockflow.coach.dto.CoachNewsDto;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.news.service.GoogleNewsRssProvider;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 질문에 종목이 나오면 그 종목의 최근 기사를 찾아 온다.
 *
 * <p>코치는 투자 판단을 하지 않는다. 대신 사용자가 스스로 읽어 볼 수 있게 최근 소식을 건넨다.
 * 조언이 되지 않도록 지키는 것:
 * <ul>
 *   <li>고르지 않는다. 최근 일주일 기사 중 가장 새로운 세 건을 시간순으로 준다.</li>
 *   <li>풀어 쓰지 않는다. 제목과 언론사를 그대로 주고, 호재·악재 표시를 붙이지 않는다.</li>
 *   <li>모델에게 기사 내용을 주지 않는다. 모델은 "아래에 소식이 있다"는 것만 안다.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CoachNewsFinder {

    private static final int SHOWN = 3;
    /** 검색 결과는 관련도순으로 온다. 넉넉히 받아서 날짜로 다시 줄을 세운다. */
    private static final int FETCHED = 30;
    private static final Duration CACHE_TIME = Duration.ofMinutes(10);
    private static final Duration RECENT = Duration.ofDays(8);
    private static final String ALLOWED_LINK_PREFIX = "https://news.google.com/";

    private final StockRepository stockRepository;
    private final GoogleNewsRssProvider newsProvider;
    private final Clock clock;

    /** 같은 종목을 여러 사람이 물어도 10분에 한 번만 밖으로 나간다. 서버가 다시 뜨면 비워진다. */
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public Optional<CoachNewsDto> find(String question) {
        Optional<Stock> mentioned = StockMentionFinder.find(question, stockRepository.findAll());
        if (mentioned.isEmpty()) {
            return Optional.empty();
        }
        Stock stock = mentioned.get();
        List<CoachNewsDto.Item> items = recentNews(stock);
        if (items.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new CoachNewsDto(stock.getName(), stock.getSymbol(), items));
    }

    private List<CoachNewsDto.Item> recentNews(Stock stock) {
        LocalDateTime now = LocalDateTime.now(clock);
        Cached cached = cache.get(stock.getSymbol());
        if (cached != null && cached.fetchedAt().plus(CACHE_TIME).isAfter(now)) {
            return cached.items();
        }
        List<CoachNewsDto.Item> items;
        try {
            // when:7d 는 최근 7일 기사만 달라는 검색어다. 이름만 넣어 회사 소식 전반을 받는다.
            List<NewsDto> found = newsProvider.search(stock.getName() + " when:7d", stock.getSymbol(), FETCHED);
            items = newestFirst(found, now);
        } catch (Exception exception) {
            // 뉴스를 못 가져와도 코치는 답한다. 소식 카드만 빠진다.
            log.warn("코치용 뉴스 조회 실패: symbol={} reason={}", stock.getSymbol(), exception.toString());
            return List.of();
        }
        cache.put(stock.getSymbol(), new Cached(now, items));
        return items;
    }

    private List<CoachNewsDto.Item> newestFirst(List<NewsDto> found, LocalDateTime now) {
        Map<String, CoachNewsDto.Item> byTitle = new LinkedHashMap<>();
        found.stream()
                .filter(news -> news.title() != null && !news.title().isBlank())
                .filter(news -> news.publishedAt() != null && news.publishedAt().isAfter(now.minus(RECENT)))
                .sorted(Comparator.comparing(NewsDto::publishedAt).reversed())
                .forEach(news -> byTitle.putIfAbsent(news.title().trim(), new CoachNewsDto.Item(
                        news.title().trim(),
                        sourceName(news.source()),
                        safeLink(news.sourceUrl()),
                        news.publishedAt())));
        return byTitle.values().stream().limit(SHOWN).toList();
    }

    /** "한국경제 / Google News RSS" 에서 언론사 이름만 남긴다. */
    private String sourceName(String raw) {
        if (raw == null) {
            return "";
        }
        int separator = raw.indexOf(" / ");
        String name = separator > 0 ? raw.substring(0, separator) : raw;
        return "Google News RSS".equals(name.trim()) ? "" : name.trim();
    }

    /** 화면이 그대로 링크로 건다. 뉴스 검색이 준 주소가 아니면 링크를 걸지 않는다. */
    private String safeLink(String url) {
        return url != null && url.startsWith(ALLOWED_LINK_PREFIX) ? url : null;
    }

    private record Cached(LocalDateTime fetchedAt, List<CoachNewsDto.Item> items) {
    }
}
