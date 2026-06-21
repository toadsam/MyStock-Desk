package com.stockflow.portfolio;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.List;
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
class PortfolioFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void transactionRecordUpdatesHoldingsAndPortfolioRiskActionIsSaved() throws Exception {
        String token = registerAndReadToken();

        MvcResult created = mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.ofEntries(
                                Map.entry("symbol", "005930"),
                                Map.entry("stockName", "Samsung Electronics"),
                                Map.entry("transactionType", "BUY"),
                                Map.entry("quantity", 3),
                                Map.entry("price", 78600),
                                Map.entry("fee", 0),
                                Map.entry("tax", 0),
                                Map.entry("transactionDate", "2026-06-20"),
                                Map.entry("reason", "AI semiconductor demand"),
                                Map.entry("memo", "Split buy"),
                                Map.entry("tags", List.of("semiconductor", "record"))
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.symbol").value("005930"))
                .andReturn();

        long transactionId = read(created, "data", "id").asLong();

        MvcResult holdings = mockMvc.perform(get("/api/holdings")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(containsSymbol(read(holdings, "data"), "005930"));

        mockMvc.perform(get("/api/portfolio")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalAsset").exists());

        mockMvc.perform(post("/api/portfolio/risk-actions")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of("action", "Increase ETF weight by 10%"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.action").value("Increase ETF weight by 10%"))
                .andExpect(jsonPath("$.data.status").value("SELECTED"));

        mockMvc.perform(get("/api/portfolio/risk-actions")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].action").value("Increase ETF weight by 10%"));

        mockMvc.perform(delete("/api/transactions/{id}", transactionId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult transactions = mockMvc.perform(get("/api/transactions")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertFalse(containsId(read(transactions, "data"), transactionId));
    }

    private boolean containsSymbol(JsonNode items, String symbol) {
        for (JsonNode item : items) {
            if (symbol.equals(item.path("symbol").asText())) {
                return true;
            }
        }
        return false;
    }

    private boolean containsId(JsonNode items, long id) {
        for (JsonNode item : items) {
            if (item.path("id").asLong() == id) {
                return true;
            }
        }
        return false;
    }

    private String registerAndReadToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "Portfolio Tester",
                                "email", "portfolio-user-" + System.nanoTime() + "@test.com",
                                "password", "stockflow1234"
                        ))))
                .andExpect(status().isOk())
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
