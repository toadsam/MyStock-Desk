package com.stockflow.earnings.dart;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.stock.entity.Stock;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.zip.ZipInputStream;
import javax.xml.parsers.DocumentBuilderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.w3c.dom.Element;

@Component
@RequiredArgsConstructor
public class OpenDartClient {

    private static final String BASE_URL = "https://opendart.fss.or.kr/api";
    private static final DateTimeFormatter DART_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final List<ReportTarget> REPORT_TARGETS = List.of(
            new ReportTarget(0, 1, "11013"),
            new ReportTarget(1, 4, "11011"),
            new ReportTarget(1, 3, "11014"),
            new ReportTarget(1, 2, "11012"),
            new ReportTarget(1, 1, "11013"),
            new ReportTarget(2, 4, "11011"),
            new ReportTarget(2, 3, "11014"),
            new ReportTarget(2, 2, "11012"),
            new ReportTarget(2, 1, "11013")
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private Map<String, CorpCode> corpCodeByStockCode;

    @Value("${stockflow.dart.api-key:}")
    private String apiKey;

    @Value("${stockflow.dart.enabled:true}")
    private boolean enabled;

    public boolean isAvailable() {
        return enabled && StringUtils.hasText(apiKey);
    }

    public Optional<DartFinancialSnapshot> fetchLatestFinancials(Stock stock) {
        if (!isAvailable() || stock == null || !StringUtils.hasText(stock.getSymbol())) {
            return Optional.empty();
        }

        return findCorpCode(stock.getSymbol())
                .flatMap(corpCode -> REPORT_TARGETS.stream()
                        .map(target -> fetchFinancials(corpCode, stock, target))
                        .flatMap(Optional::stream)
                        .findFirst());
    }

    private Optional<DartFinancialSnapshot> fetchFinancials(CorpCode corpCode, Stock stock, ReportTarget target) {
        int year = LocalDate.now().getYear() - target.yearOffset();
        try {
            URI uri = URI.create(BASE_URL + "/fnlttSinglAcntAll.json"
                    + "?crtfc_key=" + encode(apiKey)
                    + "&corp_code=" + encode(corpCode.corpCode())
                    + "&bsns_year=" + year
                    + "&reprt_code=" + target.reportCode()
                    + "&fs_div=CFS");
            JsonNode root = getJson(uri);
            if (!"000".equals(root.path("status").asText())) {
                return Optional.empty();
            }

            Map<String, BigDecimal> accounts = extractAccounts(root.path("list"));
            BigDecimal revenue = first(accounts, "revenue", "sales");
            BigDecimal operatingProfit = first(accounts, "operatingProfit");
            BigDecimal netIncome = first(accounts, "netIncome");
            if (revenue == null && operatingProfit == null && netIncome == null) {
                return Optional.empty();
            }

            BigDecimal margin = operatingMargin(revenue, operatingProfit);
            LocalDate announcementDate = fetchLatestFilingDate(corpCode.corpCode(), year)
                    .orElse(LocalDate.now());

            return Optional.of(new DartFinancialSnapshot(
                    stock.getSymbol(),
                    stock.getName(),
                    year,
                    target.quarter(),
                    zeroIfNull(revenue),
                    zeroIfNull(operatingProfit),
                    zeroIfNull(netIncome),
                    margin,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    announcementDate,
                    "DART OpenAPI",
                    LocalDateTime.now()
            ));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<LocalDate> fetchLatestFilingDate(String corpCode, int year) {
        try {
            URI uri = URI.create(BASE_URL + "/list.json"
                    + "?crtfc_key=" + encode(apiKey)
                    + "&corp_code=" + encode(corpCode)
                    + "&bgn_de=" + year + "0101"
                    + "&end_de=" + LocalDate.now().format(DART_DATE)
                    + "&pblntf_ty=A"
                    + "&page_count=10");
            JsonNode root = getJson(uri);
            if (!"000".equals(root.path("status").asText())) {
                return Optional.empty();
            }
            for (JsonNode item : root.path("list")) {
                String reportName = item.path("report_nm").asText("");
                if (reportName.contains("보고서")) {
                    return parseDate(item.path("rcept_dt").asText());
                }
            }
        } catch (Exception ignored) {
            return Optional.empty();
        }
        return Optional.empty();
    }

    private Optional<CorpCode> findCorpCode(String stockCode) {
        if (corpCodeByStockCode == null) {
            corpCodeByStockCode = loadCorpCodes();
        }
        return Optional.ofNullable(corpCodeByStockCode.get(stockCode));
    }

    private Map<String, CorpCode> loadCorpCodes() {
        Map<String, CorpCode> result = new HashMap<>();
        try {
            URI uri = URI.create(BASE_URL + "/corpCode.xml?crtfc_key=" + encode(apiKey));
            HttpRequest request = request(uri);
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return result;
            }

            try (ZipInputStream zipInputStream = new ZipInputStream(new ByteArrayInputStream(response.body()))) {
                if (zipInputStream.getNextEntry() == null) {
                    return result;
                }
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                var document = factory.newDocumentBuilder().parse(zipInputStream);
                var nodes = document.getElementsByTagName("list");
                for (int i = 0; i < nodes.getLength(); i++) {
                    Element element = (Element) nodes.item(i);
                    String stockCode = text(element, "stock_code");
                    if (StringUtils.hasText(stockCode)) {
                        result.put(stockCode, new CorpCode(text(element, "corp_code"), text(element, "corp_name"), stockCode));
                    }
                }
            }
        } catch (Exception ignored) {
            return result;
        }
        return result;
    }

    private Map<String, BigDecimal> extractAccounts(JsonNode list) {
        Map<String, BigDecimal> accounts = new LinkedHashMap<>();
        for (JsonNode item : list) {
            String accountName = item.path("account_nm").asText("").toLowerCase(Locale.ROOT).replace(" ", "");
            BigDecimal amount = parseAmount(item.path("thstrm_amount").asText(""));
            if (amount == null) {
                continue;
            }
            if (containsAny(accountName, "매출액", "영업수익", "수익(매출액)", "revenue", "sales")) {
                accounts.putIfAbsent("revenue", amount);
            }
            if (containsAny(accountName, "영업이익", "operatingprofit")) {
                accounts.putIfAbsent("operatingProfit", amount);
            }
            if (containsAny(accountName, "당기순이익", "분기순이익", "반기순이익", "profit(loss)", "netincome")) {
                accounts.putIfAbsent("netIncome", amount);
            }
        }
        return accounts;
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate.toLowerCase(Locale.ROOT).replace(" ", ""))) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal first(Map<String, BigDecimal> accounts, String... keys) {
        for (String key : keys) {
            BigDecimal value = accounts.get(key);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private BigDecimal operatingMargin(BigDecimal revenue, BigDecimal operatingProfit) {
        if (revenue == null || operatingProfit == null || revenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return operatingProfit.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal parseAmount(String raw) {
        if (!StringUtils.hasText(raw) || "-".equals(raw.trim())) {
            return null;
        }
        String normalized = raw.replace(",", "").replace("(", "-").replace(")", "").trim();
        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Optional<LocalDate> parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDate.parse(value, DART_DATE));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private JsonNode getJson(URI uri) throws Exception {
        HttpResponse<String> response = httpClient.send(request(uri), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("DART HTTP " + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }

    private HttpRequest request(URI uri) {
        return HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(8))
                .header("User-Agent", "StockFlow/1.0")
                .GET()
                .build();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String text(Element element, String tagName) {
        var nodes = element.getElementsByTagName(tagName);
        if (nodes.getLength() == 0 || nodes.item(0).getTextContent() == null) {
            return "";
        }
        return nodes.item(0).getTextContent().trim();
    }

    private record CorpCode(String corpCode, String corpName, String stockCode) {
    }

    private record ReportTarget(int yearOffset, int quarter, String reportCode) {
    }
}
