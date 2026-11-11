package com.stockflow.coach.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 코치의 답을 쓰는 모델을 부르는 자리. 글을 받아 글을 돌려줄 뿐, 무엇을 보낼지와 답을 믿을지는 모른다.
 *
 * <p>캡처 읽기({@code ReceiptImageParser})와 같은 설정(stockflow.ai.*)을 쓴다. 키가 없으면 꺼진 것으로 본다.
 */
@Slf4j
@Component
public class OpenAiCoachClient {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${stockflow.ai.provider:local}")
    private String aiProvider;

    @Value("${stockflow.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${stockflow.coach.model:${stockflow.ai.openai.model:gpt-5-mini}}")
    private String model;

    /** 답 하나에 쓸 수 있는 출력의 상한. 생각하는 데 쓰는 토큰도 여기에 들어간다. 비용의 천장이다. */
    @Value("${stockflow.coach.max-output-tokens:1500}")
    private int maxOutputTokens;

    public boolean isEnabled() {
        return "openai".equalsIgnoreCase(aiProvider) && openAiApiKey != null && !openAiApiKey.isBlank();
    }

    /**
     * @return 모델이 쓴 글. 부르지 못했거나 빈 답이면 null. 예외를 던지지 않는다. 코치는 정해진 답으로 돌아가면 된다.
     */
    public String complete(String instructions, String userContent) {
        if (!isEnabled()) {
            return null;
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("instructions", instructions);
            body.put("input", List.of(Map.of("role", "user", "content", userContent)));
            body.put("max_output_tokens", maxOutputTokens);
            if (model.startsWith("gpt-5") || model.startsWith("o")) {
                // 짧은 답에 오래 생각할 필요가 없다. 기다리는 시간과 비용이 준다.
                body.put("reasoning", Map.of("effort", "low"));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                // 오류 본문에는 키가 들어 있지 않다. 원인을 알 수 있게 앞부분만 남긴다.
                log.warn("코치 모델 호출 실패: status={} body={}", response.statusCode(), head(response.body()));
                return null;
            }
            String text = extractText(response.body());
            if (text.isBlank()) {
                log.warn("코치 모델이 빈 답을 돌려줌: {}", head(response.body()));
                return null;
            }
            return text.trim();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception exception) {
            log.warn("코치 모델 호출 중 오류: {}", exception.toString());
            return null;
        }
    }

    private String extractText(String responseBody) throws Exception {
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

    private String head(String body) {
        if (body == null) {
            return "";
        }
        String flat = body.replaceAll("\\s+", " ");
        return flat.length() > 300 ? flat.substring(0, 300) : flat;
    }
}
