package com.stockflow.company;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class CompanyCoachFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void companyAnalysisWatchlistAndCoachChatWork() throws Exception {
        String token = registerAndReadToken();

        mockMvc.perform(get("/api/companies/{symbol}/analysis", "005930")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stock.symbol").value("005930"))
                .andExpect(jsonPath("$.data.metrics[0].label").exists())
                .andExpect(jsonPath("$.data.aiSummary").exists());

        mockMvc.perform(post("/api/watchlist/{symbol}", "005930")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stock.symbol").value("005930"));

        mockMvc.perform(get("/api/watchlist")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].stock.symbol").value("005930"));

        mockMvc.perform(get("/api/ai/financial-coach/messages")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].role").value("ASSISTANT"));

        mockMvc.perform(post("/api/ai/financial-coach/chat")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of("message", "How risky is my portfolio?"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.answer.role").value("ASSISTANT"))
                .andExpect(jsonPath("$.data.context.totalAsset").exists());

        MvcResult messages = mockMvc.perform(get("/api/ai/financial-coach/messages")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertMessageCountAtLeast(read(messages, "data"), 2);

        mockMvc.perform(delete("/api/watchlist/{symbol}", "005930")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private void assertMessageCountAtLeast(JsonNode messages, int expected) {
        if (messages.size() < expected) {
            throw new AssertionError("Expected at least " + expected + " coach messages but got " + messages.size());
        }
    }

    private String registerAndReadToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "Coach Tester",
                                "email", "coach-user-" + System.nanoTime() + "@test.com",
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
