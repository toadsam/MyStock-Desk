package com.stockflow.expense.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 모델이 돌려준 JSON 을 결과로 바꾸는 부분만 본다. 모델 호출은 여기서 하지 않는다.
 */
class ReceiptImageParserTest {

    private final ReceiptImageParser parser = new ReceiptImageParser();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private ReceiptImageParser.Result read(String json) throws Exception {
        return parser.toResult(objectMapper.readTree(json));
    }

    @Test
    @DisplayName("입금이나 취소라서 뺀 건수를 결과에 담는다")
    void keepsSkippedCount() throws Exception {
        ReceiptImageParser.Result result = read("""
                {
                  "items": [{"merchant": "카페", "amount": 4500, "date": "2026-11-10"}],
                  "reportedTotal": null,
                  "skipped": 2,
                  "notes": []
                }
                """);

        assertThat(result.items()).hasSize(1);
        assertThat(result.skipped()).isEqualTo(2);
    }

    @Test
    @DisplayName("건수가 없거나 숫자가 아니거나 음수면 0 으로 본다")
    void treatsUnknownSkippedAsZero() throws Exception {
        assertThat(read("{\"items\": []}").skipped()).isZero();
        assertThat(read("{\"items\": [], \"skipped\": \"두 건\"}").skipped()).isZero();
        assertThat(read("{\"items\": [], \"skipped\": -3}").skipped()).isZero();
        assertThat(read("{\"items\": [], \"skipped\": null}").skipped()).isZero();
    }

    @Test
    @DisplayName("금액이 0 이하인 줄은 결제 건으로 넣지 않는다")
    void dropsNonPositiveAmounts() throws Exception {
        ReceiptImageParser.Result result = read("""
                {
                  "items": [
                    {"merchant": "환불", "amount": -3000, "date": "2026-11-10"},
                    {"merchant": "빵집", "amount": "3,200원", "date": "2026-11-10"}
                  ]
                }
                """);

        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).merchant()).isEqualTo("빵집");
        assertThat(result.items().get(0).amount()).isEqualByComparingTo("3200");
    }
}
