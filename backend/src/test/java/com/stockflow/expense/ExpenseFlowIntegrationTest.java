package com.stockflow.expense;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class ExpenseFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void expenseCrudAndSavingSimulationWorkTogether() throws Exception {
        String token = registerAndReadToken();

        MvcResult created = mockMvc.perform(post("/api/expenses")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "category", "카페",
                                "merchant", "테스트 카페",
                                "amount", 12000,
                                "spentDate", "2026-06-10",
                                "memo", "라떼"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.merchant").value("테스트 카페"))
                .andReturn();

        long expenseId = read(created, "data", "id").asLong();

        mockMvc.perform(patch("/api/expenses/{id}", expenseId)
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "category", "카페",
                                "merchant", "수정 카페",
                                "amount", 9000,
                                "spentDate", "2026-06-10",
                                "memo", "절약"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.merchant").value("수정 카페"))
                .andExpect(jsonPath("$.data.amount").value(9000));

        MvcResult expenses = mockMvc.perform(get("/api/expenses")
                        .param("month", "2026-06")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(containsId(read(expenses, "data"), expenseId));

        mockMvc.perform(get("/api/expenses/monthly-summary")
                        .param("month", "2026-06")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount").value(9000));

        mockMvc.perform(post("/api/expenses/saving-simulation")
                        .param("month", "2026-06")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "categoryReductionRates", Map.of("카페", 50),
                                "fixedSavingAmount", 10000
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.monthlySavingAmount").value(14500));

        mockMvc.perform(delete("/api/expenses/{id}", expenseId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult afterDelete = mockMvc.perform(get("/api/expenses")
                        .param("month", "2026-06")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertFalse(containsId(read(afterDelete, "data"), expenseId));
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
                                "name", "소비테스터",
                                "email", "expense-user-" + System.nanoTime() + "@test.com",
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
