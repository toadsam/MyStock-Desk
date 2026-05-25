package com.stockflow.transaction;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TransactionFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void loginAndCreateBuyRecordStoresTransaction() throws Exception {
        String token = login("investor@stockflow.com", "stockflow1234");

        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.ofEntries(
                                Map.entry("symbol", "005930"),
                                Map.entry("stockName", "삼성전자"),
                                Map.entry("transactionType", "BUY"),
                                Map.entry("quantity", 1),
                                Map.entry("price", 78600),
                                Map.entry("fee", 12),
                                Map.entry("tax", 0),
                                Map.entry("transactionDate", "2026-05-25"),
                                Map.entry("reason", "HBM 수요 증가 여부 확인"),
                                Map.entry("memo", "실제 주문은 증권앱에서 처리했고 StockFlow에는 기록만 저장"),
                                Map.entry("tags", java.util.List.of("반도체", "기록"))
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactionType").value("BUY"))
                .andExpect(jsonPath("$.data.totalAmount").value(78600));

        mockMvc.perform(get("/api/transactions").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].reason").value("HBM 수요 증가 여부 확인"));
    }

    @Test
    void deprecatedTradeOrderApiDoesNotCreateOrder() throws Exception {
        String token = login("investor@stockflow.com", "stockflow1234");

        mockMvc.perform(post("/api/trades/orders")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "symbol", "005930",
                                "orderType", "BUY",
                                "orderMethod", "MARKET",
                                "orderPrice", 78600,
                                "quantity", 1
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("DEPRECATED_API"));
    }

    @Test
    void registerCreatesMemberPortfolioAndToken() throws Exception {
        String email = "new-investor@test.com";
        MvcResult register = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "새투자",
                                "email", email,
                                "password", "stockflow1234"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.member.email").value(email))
                .andReturn();

        String token = read(register, "data", "accessToken").asText();
        MvcResult portfolio = mockMvc.perform(get("/api/portfolio").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        assertEquals(0, new BigDecimal("100000000.00")
                .compareTo(read(portfolio, "data", "totalAsset").decimalValue()));
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        return read(result, "data", "accessToken").asText();
    }

    private JsonNode read(MvcResult result, String... path) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        for (String segment : path) {
            node = node.get(segment);
        }
        return node;
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
