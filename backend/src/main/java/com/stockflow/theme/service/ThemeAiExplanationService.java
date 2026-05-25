package com.stockflow.theme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.theme.dto.RelatedThemeStockDto;
import com.stockflow.theme.dto.ThemeAiExplanationDto;
import com.stockflow.theme.dto.ThemeNewsItemDto;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ThemeAiExplanationService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${stockflow.ai.provider:local}")
    private String aiProvider;

    @Value("${stockflow.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${stockflow.ai.openai.model:gpt-4.1-mini}")
    private String openAiModel;

    public ThemeAiExplanationDto explain(String sourceCompany, List<String> themeKeywords, RelatedThemeStockDto stock) {
        if ("openai".equalsIgnoreCase(aiProvider) && openAiApiKey != null && !openAiApiKey.isBlank()) {
            ThemeAiExplanationDto explanation = explainWithOpenAi(sourceCompany, themeKeywords, stock);
            if (explanation != null) {
                return explanation;
            }
        }
        return localExplanation(sourceCompany, themeKeywords, stock);
    }

    private ThemeAiExplanationDto explainWithOpenAi(String sourceCompany, List<String> themeKeywords, RelatedThemeStockDto stock) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", openAiModel);
            body.put("instructions", """
                    당신은 투자 추천을 하지 않는 투자 기록/분석 서비스의 보조 분석가입니다.
                    매수/매도 추천, 목표가, 상승 확률 표현은 금지합니다.
                    실제 뉴스 근거와 공급망 맥락을 바탕으로 초보자가 확인할 점만 한국어 JSON으로 답하세요.
                    JSON keys: summary, evidence, checkpoints, risks, verdict
                    evidence/checkpoints/risks는 각각 2~3개의 짧은 문자열 배열입니다.
                    """);
            body.put("input", prompt(sourceCompany, themeKeywords, stock));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }
            String text = extractOpenAiText(response.body());
            JsonNode node = objectMapper.readTree(stripCodeFence(text));
            return new ThemeAiExplanationDto(
                    node.path("summary").asText(),
                    strings(node.path("evidence")),
                    strings(node.path("checkpoints")),
                    strings(node.path("risks")),
                    node.path("verdict").asText(),
                    "openai:" + openAiModel
            );
        } catch (Exception ignored) {
            return null;
        }
    }

    private String prompt(String sourceCompany, List<String> themeKeywords, RelatedThemeStockDto stock) {
        return """
                기준기업: %s
                테마 키워드: %s
                후보 종목: %s (%s)
                공급망 단계: %s
                관련도 점수: %d
                점수 요인: %s
                기존 관계 설명: %s
                근거 뉴스: %s
                확인 지표: %s
                리스크: %s
                """.formatted(
                sourceCompany,
                String.join(", ", themeKeywords),
                stock.stockName(),
                stock.symbol(),
                stock.stageName(),
                stock.relationScore(),
                String.join(", ", stock.scoreFactors()),
                stock.relationReason(),
                stock.evidenceNews().stream().map(ThemeNewsItemDto::title).toList(),
                stock.checkMetrics(),
                stock.risks()
        );
    }

    private ThemeAiExplanationDto localExplanation(String sourceCompany, List<String> themeKeywords, RelatedThemeStockDto stock) {
        String evidenceStrength = stock.relationScore() >= 70 ? "뉴스 근거가 비교적 강하게 잡혔습니다" :
                stock.relationScore() >= 45 ? "뉴스 근거는 있으나 추가 확인이 필요합니다" :
                        "현재 뉴스 근거는 약한 편입니다";
        String summary = stock.stockName() + "은 " + stock.stageName() + " 영역에서 " + sourceCompany
                + " 이슈와 연결해 볼 수 있는 후보입니다. " + evidenceStrength + ".";
        List<String> evidence = stock.evidenceNews().isEmpty()
                ? List.of("공급망 지식 베이스에는 연결되어 있지만 최근 뉴스 근거는 제한적입니다.", "관련도 점수는 " + stock.relationScore() + "점입니다.")
                : List.of(
                        "최근 뉴스 검색 근거 " + stock.evidenceCount() + "건이 확인되었습니다.",
                        "점수 요인: " + String.join(", ", stock.scoreFactors().stream().limit(3).toList()),
                        "주요 테마 키워드: " + String.join(", ", themeKeywords.stream().limit(4).toList())
                );
        List<String> checkpoints = stock.checkMetrics().stream().limit(3).toList();
        List<String> risks = stock.risks().stream().limit(3).toList();
        String verdict = stock.relationScore() >= 70
                ? "공부 후보로 우선 확인할 수 있지만, 실제 매출과 수주 연결 여부를 확인해야 합니다."
                : "관련 후보로만 참고하고, 공시와 실적에서 연결 근거를 먼저 확인하세요.";
        return new ThemeAiExplanationDto(summary, evidence, checkpoints, risks, verdict, "local-evidence-ai");
    }

    private String extractOpenAiText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode outputText = root.path("output_text");
        if (!outputText.isMissingNode() && !outputText.asText().isBlank()) {
            return outputText.asText();
        }
        StringBuilder builder = new StringBuilder();
        for (JsonNode output : root.path("output")) {
            for (JsonNode content : output.path("content")) {
                JsonNode text = content.path("text");
                if (!text.isMissingNode()) {
                    builder.append(text.asText());
                }
            }
        }
        return builder.toString();
    }

    private String stripCodeFence(String text) {
        return text == null ? "{}" : text.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    private List<String> strings(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        return node.findValuesAsText("");
    }
}
