package com.stockflow.disclosure.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.disclosure.dto.DisclosureDto;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class SecDisclosureProvider {

    private static final String TICKER_URL = "https://www.sec.gov/files/company_tickers.json";
    private static final String SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK%010d.json";
    private static final String ARCHIVE_URL = "https://www.sec.gov/Archives/edgar/data/%d/%s/%s";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Map<String, SecCompany> companyByTicker;

    @Value("${stockflow.sec.enabled:true}")
    private boolean enabled;

    @Value("${stockflow.sec.user-agent:StockFlow/1.0 contact@example.com}")
    private String userAgent;

    public List<DisclosureDto> fetchRecent(List<String> symbols, int limitPerSymbol) {
        if (!enabled || symbols.isEmpty() || limitPerSymbol <= 0) {
            return List.of();
        }

        List<DisclosureDto> result = new ArrayList<>();
        for (String symbol : symbols) {
            findCompany(symbol).ifPresent(company -> result.addAll(fetchCompanyFilings(company, limitPerSymbol)));
        }
        return result.stream()
                .sorted((left, right) -> right.filingDate().compareTo(left.filingDate()))
                .toList();
    }

    private List<DisclosureDto> fetchCompanyFilings(SecCompany company, int limit) {
        try {
            JsonNode recent = getJson(URI.create(SUBMISSIONS_URL.formatted(company.cik()))).path("filings").path("recent");
            JsonNode forms = recent.path("form");
            JsonNode accessionNumbers = recent.path("accessionNumber");
            JsonNode filingDates = recent.path("filingDate");
            JsonNode reportDates = recent.path("reportDate");
            JsonNode primaryDocuments = recent.path("primaryDocument");
            JsonNode descriptions = recent.path("primaryDocDescription");

            List<DisclosureDto> result = new ArrayList<>();
            for (int index = 0; index < forms.size() && result.size() < limit; index++) {
                String form = forms.path(index).asText("");
                if (!isInvestorRelevant(form)) {
                    continue;
                }
                String accessionNumber = accessionNumbers.path(index).asText("");
                String primaryDocument = primaryDocuments.path(index).asText("");
                String accessionPath = accessionNumber.replace("-", "");
                String sourceUrl = ARCHIVE_URL.formatted(company.cik(), accessionPath, primaryDocument);
                LocalDate filingDate = parseDate(filingDates.path(index).asText("")).orElse(LocalDate.now());
                LocalDate reportDate = parseDate(reportDates.path(index).asText("")).orElse(null);
                String description = descriptions.path(index).asText("");
                result.add(new DisclosureDto(
                        company.ticker() + "-" + accessionNumber,
                        company.ticker(),
                        company.title(),
                        form,
                        company.ticker() + " " + form + " filing",
                        summary(form, description),
                        "SEC EDGAR",
                        sourceUrl,
                        filingDate,
                        reportDate,
                        LocalDateTime.now(),
                        "OFFICIAL",
                        true
                ));
            }
            return result;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private Optional<SecCompany> findCompany(String symbol) {
        if (!StringUtils.hasText(symbol)) {
            return Optional.empty();
        }
        if (companyByTicker == null) {
            companyByTicker = loadCompanies();
        }
        return Optional.ofNullable(companyByTicker.get(symbol.trim().toUpperCase(Locale.ROOT)));
    }

    private Map<String, SecCompany> loadCompanies() {
        Map<String, SecCompany> result = new LinkedHashMap<>();
        try {
            JsonNode root = getJson(URI.create(TICKER_URL));
            root.fields().forEachRemaining(entry -> {
                JsonNode item = entry.getValue();
                String ticker = item.path("ticker").asText("").toUpperCase(Locale.ROOT);
                if (StringUtils.hasText(ticker)) {
                    result.put(ticker, new SecCompany(
                            item.path("cik_str").asInt(),
                            ticker,
                            item.path("title").asText(ticker)
                    ));
                }
            });
        } catch (Exception ignored) {
            return result;
        }
        return result;
    }

    private boolean isInvestorRelevant(String form) {
        return List.of("10-K", "10-Q", "8-K", "20-F", "40-F", "6-K", "S-1", "DEF 14A", "4", "13F-HR")
                .contains(form);
    }

    private String summary(String form, String description) {
        if (StringUtils.hasText(description)) {
            return "SEC 공식 공시입니다. 원문과 제출일을 확인하세요. " + description;
        }
        return switch (form) {
            case "10-K" -> "연간보고서입니다. 매출, 이익, 리스크 요인, 경영진 논의를 확인하세요.";
            case "10-Q" -> "분기보고서입니다. 최근 실적과 가이던스 변화 여부를 확인하세요.";
            case "8-K" -> "주요 이벤트 공시입니다. 실적, 경영진 변경, 계약, 자본 조달 등 즉시성 이슈를 확인하세요.";
            case "4" -> "내부자 거래 공시입니다. 임원/주요 주주의 매수·매도 내역을 확인하세요.";
            default -> "SEC 공식 공시입니다. 원문과 제출일을 확인하세요.";
        };
    }

    private Optional<LocalDate> parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDate.parse(value));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private JsonNode getJson(URI uri) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(8))
                .header("User-Agent", userAgent)
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("SEC HTTP " + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }

    private record SecCompany(int cik, String ticker, String title) {
    }
}
