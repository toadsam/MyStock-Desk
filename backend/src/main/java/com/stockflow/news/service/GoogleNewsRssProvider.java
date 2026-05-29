package com.stockflow.news.service;

import com.stockflow.global.type.ImpactType;
import com.stockflow.news.dto.NewsDto;
import java.io.ByteArrayInputStream;
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
import java.util.List;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.w3c.dom.Element;

@Component
public class GoogleNewsRssProvider {

    private static final String RSS_URL = "https://news.google.com/rss/search?q=%s&hl=ko&gl=KR&ceid=KR:ko";
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    @Value("${stockflow.news.google-rss.enabled:true}")
    private boolean enabled;

    public List<NewsDto> search(String query, String relatedStockSymbol, int limit) {
        if (!enabled || !StringUtils.hasText(query) || limit <= 0) {
            return List.of();
        }
        try {
            URI uri = URI.create(RSS_URL.formatted(URLEncoder.encode(query, StandardCharsets.UTF_8)));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(6))
                    .header("User-Agent", "StockFlow/1.0")
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return List.of();
            }

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            var document = factory.newDocumentBuilder().parse(new ByteArrayInputStream(response.body()));
            var nodes = document.getElementsByTagName("item");
            List<NewsDto> result = new ArrayList<>();
            for (int i = 0; i < nodes.getLength() && result.size() < limit; i++) {
                Element item = (Element) nodes.item(i);
                String title = text(item, "title");
                if (!StringUtils.hasText(title)) {
                    continue;
                }
                String source = text(item, "source");
                result.add(new NewsDto(
                        (long) -(i + 1),
                        cleanTitle(title),
                        "Google News RSS에서 수집한 최신 기사입니다. 원문 확인 후 투자 기록의 기존 판단 근거가 유지되는지 점검하세요.",
                        "실시간 뉴스",
                        StringUtils.hasText(source) ? source + " / Google News RSS" : "Google News RSS",
                        text(item, "link"),
                        "Google News RSS",
                        LocalDateTime.now(),
                        "AGGREGATED",
                        false,
                        classify(title),
                        relatedStockSymbol,
                        publishedAt(text(item, "pubDate")),
                        importanceScore(title)
                ));
            }
            return result;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private ImpactType classify(String title) {
        String value = title == null ? "" : title;
        if (containsAny(value, "하락", "부진", "손실", "적자", "우려", "리스크", "소송", "규제")) {
            return ImpactType.NEGATIVE;
        }
        if (containsAny(value, "상승", "호조", "증가", "수주", "확대", "개선", "성장", "흑자")) {
            return ImpactType.POSITIVE;
        }
        return ImpactType.NEUTRAL;
    }

    private boolean containsAny(String value, String... keywords) {
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private int importanceScore(String title) {
        int score = 62;
        if (containsAny(title, "실적", "공시", "수주", "영업이익", "매출", "가이던스")) {
            score += 18;
        }
        if (containsAny(title, "급등", "급락", "소송", "규제", "합병", "분할")) {
            score += 12;
        }
        return Math.min(score, 95);
    }

    private LocalDateTime publishedAt(String pubDate) {
        if (!StringUtils.hasText(pubDate)) {
            return LocalDateTime.now();
        }
        try {
            return ZonedDateTime.parse(pubDate, DateTimeFormatter.RFC_1123_DATE_TIME)
                    .withZoneSameInstant(SEOUL)
                    .toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.now();
        }
    }

    private String cleanTitle(String title) {
        int separator = title.lastIndexOf(" - ");
        if (separator > 0) {
            return title.substring(0, separator).trim();
        }
        return title.trim();
    }

    private String text(Element element, String tagName) {
        var nodes = element.getElementsByTagName(tagName);
        if (nodes.getLength() == 0 || nodes.item(0).getTextContent() == null) {
            return "";
        }
        return nodes.item(0).getTextContent().trim();
    }
}
