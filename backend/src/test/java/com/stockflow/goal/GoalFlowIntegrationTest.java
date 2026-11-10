package com.stockflow.goal;

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
class GoalFlowIntegrationTest {

    // 날짜를 박아 두면 그날이 지난 뒤부터 깨진다. 지난 날짜의 목표는 만들 수 없기 때문이다.
    private static final String TARGET_DATE =
            java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).plusMonths(6).toString();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void goalCrudUpdatesGoalListAndSummary() throws Exception {
        String token = registerAndReadToken();

        MvcResult created = mockMvc.perform(post("/api/goals")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "title", "노트북 구입 자금",
                                "targetAmount", 2000000,
                                "currentAmount", 300000,
                                "targetDate", TARGET_DATE,
                                "status", "ACTIVE",
                                "priority", 1
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("노트북 구입 자금"))
                .andReturn();

        long goalId = read(created, "data", "id").asLong();

        mockMvc.perform(patch("/api/goals/{id}", goalId)
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "title", "노트북 구입 자금",
                                "targetAmount", 2000000,
                                "currentAmount", 2000000,
                                "targetDate", TARGET_DATE,
                                "status", "COMPLETED",
                                "priority", 1
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.progressRate").value(100));

        MvcResult goals = mockMvc.perform(get("/api/goals")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(containsId(read(goals, "data"), goalId));

        mockMvc.perform(get("/api/goals/summary")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(delete("/api/goals/{id}", goalId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult afterDelete = mockMvc.perform(get("/api/goals")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertFalse(containsId(read(afterDelete, "data"), goalId));
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
                                "name", "목표테스터",
                                "email", "goal-user-" + System.nanoTime() + "@test.com",
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
