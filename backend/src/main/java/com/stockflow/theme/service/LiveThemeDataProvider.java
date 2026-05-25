package com.stockflow.theme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.theme.dto.RelatedThemeStockDto;
import com.stockflow.theme.dto.ThemeNewsItemDto;
import java.io.StringReader;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.xml.sax.InputSource;

@Component
public class LiveThemeDataProvider {

    private static final DateTimeFormatter RSS_DATE_FORMAT = DateTimeFormatter.RFC_1123_DATE_TIME;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ThemeAiExplanationService themeAiExplanationService;

    public LiveThemeDataProvider(ThemeAiExplanationService themeAiExplanationService) {
        this.themeAiExplanationService = themeAiExplanationService;
    }

    public RelatedThemeStockDto enrichRelation(String sourceCompany, List<String> themeKeywords, RelatedThemeStockDto stock) {
        RelatedThemeStockDto quotedStock = enrichQuote(stock);
        List<ThemeNewsItemDto> evidenceNews = fetchNews(buildEvidenceQuery(sourceCompany, quotedStock)).stream()
                .limit(3)
                .toList();
        int keywordHits = countKeywordHits(evidenceNews, Stream.concat(themeKeywords.stream(), quotedStock.tags().stream()).toList());
        int coMentionHits = countKeywordHits(evidenceNews, List.of(sourceCompany, quotedStock.stockName(), quotedStock.symbol()));
        int score = relationScore(quotedStock.relationLevel(), evidenceNews.size(), keywordHits, coMentionHits);
        List<String> factors = scoreFactors(score, evidenceNews.size(), keywordHits, coMentionHits, quotedStock.currentPrice());
        RelatedThemeStockDto scoredStock = copyStock(quotedStock, quotedStock.currentPrice(), score, evidenceNews.size(), factors, evidenceNews, quotedStock.aiExplanation());
        return copyStock(scoredStock, scoredStock.currentPrice(), scoredStock.relationScore(), scoredStock.evidenceCount(),
                scoredStock.scoreFactors(), scoredStock.evidenceNews(), themeAiExplanationService.explain(sourceCompany, themeKeywords, scoredStock));
    }

    private RelatedThemeStockDto enrichQuote(RelatedThemeStockDto stock) {
        try {
            JsonNode meta = fetchYahooMeta(stock.symbol());
            if (meta == null || meta.path("regularMarketPrice").isMissingNode()) {
                return stock;
            }
            return copyStock(stock, BigDecimal.valueOf(meta.path("regularMarketPrice").asDouble()).stripTrailingZeros(),
                    stock.relationScore(), stock.evidenceCount(), stock.scoreFactors(), stock.evidenceNews(), stock.aiExplanation());
        } catch (Exception ignored) {
            return stock;
        }
    }

    private RelatedThemeStockDto copyStock(
            RelatedThemeStockDto stock,
            BigDecimal currentPrice,
            int relationScore,
            int evidenceCount,
            List<String> scoreFactors,
            List<ThemeNewsItemDto> evidenceNews,
            com.stockflow.theme.dto.ThemeAiExplanationDto aiExplanation
    ) {
        return new RelatedThemeStockDto(
                stock.symbol(),
                stock.stockName(),
                stock.market(),
                stock.stageId(),
                stock.stageName(),
                currentPrice,
                stock.relationLevel(),
                stock.relationReason(),
                stock.checkMetrics(),
                stock.risks(),
                stock.tags(),
                relationScore,
                evidenceCount,
                scoreFactors,
                evidenceNews,
                aiExplanation
        );
    }

    public List<ThemeNewsItemDto> fetchNews(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://news.google.com/rss/search?q=" + encodedQuery + "&hl=ko&gl=KR&ceid=KR:ko";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(6))
                    .header("User-Agent", "StockFlow/1.0")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return List.of();
            }
            return parseRss(response.body()).stream().limit(8).toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    public List<String> extractKeywords(List<ThemeNewsItemDto> news, List<String> fallback) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (ThemeNewsItemDto item : news) {
            for (String token : item.title().replaceAll("[^가-힣A-Za-z0-9 ]", " ").split("\\s+")) {
                String normalized = token.trim();
                if (normalized.length() < 2 || isStopWord(normalized)) {
                    continue;
                }
                counts.merge(normalized, 1, Integer::sum);
            }
        }
        List<String> keywords = counts.entrySet().stream()
                .sorted((left, right) -> Integer.compare(right.getValue(), left.getValue()))
                .map(Map.Entry::getKey)
                .limit(8)
                .toList();
        return keywords.isEmpty() ? fallback : keywords;
    }

    private JsonNode fetchYahooMeta(String symbol) throws Exception {
        String yahooSymbol = toYahooSymbol(symbol);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://query1.finance.yahoo.com/v8/finance/chart/" + yahooSymbol + "?interval=1d&range=1d"))
                .timeout(Duration.ofSeconds(6))
                .header("User-Agent", "StockFlow/1.0")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return null;
        }
        return objectMapper.readTree(response.body())
                .path("chart").path("result").path(0).path("meta");
    }

    private String buildEvidenceQuery(String sourceCompany, RelatedThemeStockDto stock) {
        String primaryTag = stock.tags().isEmpty() ? stock.stageName() : stock.tags().get(0);
        return sourceCompany + " " + stock.stockName() + " " + primaryTag;
    }

    private int countKeywordHits(List<ThemeNewsItemDto> news, List<String> keywords) {
        int hits = 0;
        for (ThemeNewsItemDto item : news) {
            String lowerTitle = item.title().toLowerCase(Locale.ROOT);
            for (String keyword : keywords) {
                if (keyword != null && !keyword.isBlank() && lowerTitle.contains(keyword.toLowerCase(Locale.ROOT))) {
                    hits++;
                }
            }
        }
        return hits;
    }

    private int relationScore(String relationLevel, int evidenceCount, int keywordHits, int coMentionHits) {
        int base = switch (relationLevel) {
            case "DIRECT" -> 22;
            case "INDIRECT" -> 14;
            default -> 8;
        };
        return Math.min(100, base + evidenceCount * 12 + keywordHits * 4 + coMentionHits * 5);
    }

    private List<String> scoreFactors(int score, int evidenceCount, int keywordHits, int coMentionHits, BigDecimal currentPrice) {
        List<String> factors = new ArrayList<>();
        factors.add("실제 뉴스 검색 근거 " + evidenceCount + "건");
        factors.add("테마/종목 키워드 일치 " + keywordHits + "회");
        factors.add("기준기업·종목 동시언급 " + coMentionHits + "회");
        if (currentPrice != null && currentPrice.compareTo(BigDecimal.ZERO) > 0) {
            factors.add("외부 시세 확인");
        }
        factors.add(score >= 70 ? "뉴스 근거 강함" : score >= 45 ? "추가 확인 필요" : "근거 약함");
        return factors;
    }

    private List<ThemeNewsItemDto> parseRss(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        var document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        var items = document.getElementsByTagName("item");
        List<ThemeNewsItemDto> result = new ArrayList<>();
        for (int index = 0; index < items.getLength(); index++) {
            Element item = (Element) items.item(index);
            String title = text(item, "title");
            String link = text(item, "link");
            String source = text(item, "source");
            LocalDateTime publishedAt = parseRssDate(text(item, "pubDate"));
            if (!title.isBlank()) {
                result.add(new ThemeNewsItemDto(title, source.isBlank() ? "Google News" : source, link, publishedAt));
            }
        }
        return result;
    }

    private String text(Element item, String tagName) {
        var nodes = item.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) {
            return "";
        }
        return nodes.item(0).getTextContent();
    }

    private LocalDateTime parseRssDate(String value) {
        try {
            return ZonedDateTime.parse(value, RSS_DATE_FORMAT)
                    .withZoneSameInstant(ZoneId.of("Asia/Seoul"))
                    .toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.now();
        }
    }

    private String toYahooSymbol(String symbol) {
        if (symbol != null && symbol.matches("\\d{6}")) {
            return symbol + ".KS";
        }
        return symbol;
    }

    private boolean isStopWord(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        return List.of("the", "and", "with", "for", "from", "news", "google", "관련", "주가", "오늘", "속보").contains(lower);
    }
}
