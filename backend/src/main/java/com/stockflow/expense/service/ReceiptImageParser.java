package com.stockflow.expense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.global.exception.ExternalDataException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 결제 내역 캡처 한 장에서 결제 건들을 읽어낸다.
 *
 * <p>카드사마다 화면이 다르고 앱 업데이트마다 또 바뀌기 때문에 정해진 틀로는 읽을 수 없다.
 * 비전 모델에게 화면을 보여주고 항목을 뽑게 한다. 여기서 AI는 읽기만 하고,
 * 검산과 저장 판단은 {@link ExpenseImportService} 가 한다.
 *
 * <p>이미지는 호출에만 쓰고 저장하지 않는다. 캡처에는 결제 내역뿐 아니라
 * 카드번호 뒷자리와 잔액, 이름이 함께 찍히기 때문이다.
 */
@Component
public class ReceiptImageParser {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${stockflow.ai.provider:local}")
    private String aiProvider;

    @Value("${stockflow.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${stockflow.ai.vision.model:${stockflow.ai.openai.model:gpt-5-mini}}")
    private String visionModel;

    private static final String INSTRUCTIONS = """
            당신은 한국 카드사/간편결제 앱의 결제 내역 화면을 읽는 도구입니다.
            화면에 보이는 결제 건만 그대로 옮겨 적으세요. 추측하거나 없는 항목을 만들지 마세요.
            한국어 JSON 하나만 출력하고 다른 말은 붙이지 마세요.

            형식:
            {
              "items": [
                {"merchant": "가게 이름", "amount": 5600, "date": "2026-09-11"}
              ],
              "reportedTotal": 화면에 적힌 합계 숫자 또는 null,
              "notes": ["읽기 어려웠던 점"]
            }

            규칙:
            - amount 는 콤마 없는 정수입니다. 자릿수를 절대 바꾸지 마세요.
            - date 는 yyyy-MM-dd 입니다. 화면에 연도가 없으면 %d 년으로 쓰세요.
            - 취소/환불/입금 건은 items 에 넣지 마세요.
            - 잔액, 누적 사용액, 한도는 결제 건이 아닙니다.
            - 화면에 합계가 보이면 reportedTotal 에 그대로 넣으세요. 없으면 null 입니다.
            """;

    public boolean isEnabled() {
        return "openai".equalsIgnoreCase(aiProvider) && openAiApiKey != null && !openAiApiKey.isBlank();
    }

    public Result read(byte[] imageBytes, String contentType) {
        if (!isEnabled()) {
            throw new ExternalDataException(
                    "AI_NOT_CONFIGURED",
                    "캡처 분석을 쓰려면 AI 설정이 필요합니다. 우선 카드 문자 붙여넣기를 이용해 주세요.");
        }
        try {
            String dataUri = "data:" + (contentType == null ? "image/png" : contentType)
                    + ";base64," + Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> textPart = Map.of(
                    "type", "input_text",
                    "text", "이 화면에 보이는 결제 내역을 빠짐없이 JSON 으로 옮겨 주세요.");
            Map<String, Object> imagePart = Map.of(
                    "type", "input_image",
                    "image_url", dataUri);
            Map<String, Object> message = Map.of(
                    "role", "user",
                    "content", List.of(textPart, imagePart));

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", visionModel);
            body.put("instructions", INSTRUCTIONS.formatted(LocalDate.now().getYear()));
            body.put("input", List.of(message));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ExternalDataException("AI_CALL_FAILED", "캡처를 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
            }
            return toResult(objectMapper.readTree(stripCodeFence(extractText(response.body()))));
        } catch (ExternalDataException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ExternalDataException("AI_CALL_FAILED", "캡처를 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    private Result toResult(JsonNode root) {
        List<Item> items = new ArrayList<>();
        for (JsonNode node : root.path("items")) {
            BigDecimal amount = node.path("amount").isNumber()
                    ? node.path("amount").decimalValue()
                    : parseAmount(node.path("amount").asText(null));
            if (amount == null || amount.signum() <= 0) {
                continue;
            }
            items.add(new Item(
                    node.path("merchant").asText("").trim(),
                    amount,
                    parseDate(node.path("date").asText(null))));
        }
        BigDecimal reportedTotal = root.path("reportedTotal").isNumber()
                ? root.path("reportedTotal").decimalValue()
                : parseAmount(root.path("reportedTotal").asText(null));
        List<String> notes = new ArrayList<>();
        for (JsonNode note : root.path("notes")) {
            String value = note.asText("").trim();
            if (!value.isEmpty()) {
                notes.add(value);
            }
        }
        return new Result(items, reportedTotal, notes);
    }

    private BigDecimal parseAmount(String raw) {
        if (raw == null || raw.isBlank() || "null".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return new BigDecimal(raw.replaceAll("[^0-9.]", ""));
        } catch (Exception ignored) {
            return null;
        }
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (Exception ignored) {
            return LocalDate.now();
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

    private String stripCodeFence(String text) {
        return text == null || text.isBlank()
                ? "{}"
                : text.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    public record Item(String merchant, BigDecimal amount, LocalDate date) {
    }

    public record Result(List<Item> items, BigDecimal reportedTotal, List<String> notes) {
    }
}
