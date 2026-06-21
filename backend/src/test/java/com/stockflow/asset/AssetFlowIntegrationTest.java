package com.stockflow.asset;

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
class AssetFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void accountCrudAndBudgetUpdateRecalculateAssetSummary() throws Exception {
        String token = registerAndReadToken();

        MvcResult created = mockMvc.perform(post("/api/assets/accounts")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "테스트 저축 계좌",
                                "accountType", "SAVINGS",
                                "institutionName", "MyWave Bank",
                                "balance", 1234000,
                                "includedInAssets", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("테스트 저축 계좌"))
                .andReturn();

        long accountId = read(created, "data", "id").asLong();

        mockMvc.perform(patch("/api/assets/accounts/{id}", accountId)
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "수정된 저축 계좌",
                                "accountType", "SAVINGS",
                                "institutionName", "MyWave Bank",
                                "balance", 1500000,
                                "includedInAssets", false
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("수정된 저축 계좌"))
                .andExpect(jsonPath("$.data.includedInAssets").value(false));

        MvcResult accounts = mockMvc.perform(get("/api/assets/accounts")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(containsAccount(read(accounts, "data"), accountId));

        mockMvc.perform(post("/api/assets/budgets/monthly")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "budgetMonth", "2026-06",
                                "incomeAmount", 5000000,
                                "livingBudgetAmount", 2200000,
                                "fixedExpenseAmount", 700000,
                                "plannedSavingAmount", 900000,
                                "plannedInvestmentAmount", 650000
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.budgetMonth").value("2026-06"))
                .andExpect(jsonPath("$.data.plannedInvestmentAmount").value(650000));

        mockMvc.perform(get("/api/assets/summary")
                        .param("month", "2026-06")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.budget.plannedSavingAmount").value(900000));

        mockMvc.perform(delete("/api/assets/accounts/{id}", accountId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult afterDelete = mockMvc.perform(get("/api/assets/accounts")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertFalse(containsAccount(read(afterDelete, "data"), accountId));
    }

    private boolean containsAccount(JsonNode accounts, long accountId) {
        for (JsonNode account : accounts) {
            if (account.path("id").asLong() == accountId) {
                return true;
            }
        }
        return false;
    }

    private String registerAndReadToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "자산테스터",
                                "email", "asset-user-" + System.nanoTime() + "@test.com",
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
