package com.stockflow.global;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.goal.entity.SavingGoal;
import com.stockflow.goal.repository.SavingGoalRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

/**
 * 말이 안 되는 입력은 저장되기 전에 걸러진다.
 * 하나라도 들어가면 월 합계, 하루 예산, 달성률이 통째로 틀어지는 값들이다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class InputLimitsIntegrationTest {

    // CI 는 UTC 로 돌고 "오늘"은 한국 날짜라, 하루 차이로 흔들리지 않게 이틀씩 띄운다.
    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Seoul"));
    private static final String PAST = TODAY.minusDays(2).toString();
    private static final String FUTURE = TODAY.plusDays(2).toString();
    private static final String NEXT_YEAR = TODAY.plusYears(1).toString();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SavingGoalRepository goalRepository;

    private String token;
    private long memberId;

    @BeforeEach
    void registerFreshMember() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "검증테스터",
                                "email", "limits-" + System.nanoTime() + "@test.com",
                                "password", "limits-pass-1"))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
        token = data.path("accessToken").asText();
        memberId = data.path("member").path("id").asLong();
    }

    @Test
    void expenseRejectsAbsurdAmountAndFutureDate() throws Exception {
        send(post("/api/expenses"), expense(8500, PAST)).andExpect(status().isOk());

        // 우리가 적은 문장은 칸 이름 없이 그대로 나간다. 화면이 이 문장을 그대로 보여 준다.
        send(post("/api/expenses"), expense(new BigDecimal("99999999999999"), PAST))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.message").value("금액은 1억 원 이하로 입력해 주세요."));
        send(post("/api/expenses"), expense(8500, FUTURE))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
        // 한 번에 여러 건 저장하는 길도 같은 규칙을 지난다.
        send(post("/api/expenses/bulk"), Map.of("items", new Object[] {expense(1500, PAST), expense(1500, FUTURE)}))
                .andExpect(status().isBadRequest());
    }

    @Test
    void goalRejectsPastDateAndNegativeSavedAmount() throws Exception {
        send(post("/api/goals"), goal("여행", 1000000, 100000, NEXT_YEAR)).andExpect(status().isOk());

        send(post("/api/goals"), goal("지난 목표", 1000000, 0, PAST)).andExpect(status().isBadRequest());
        send(post("/api/goals"), goal("마이너스", 1000000, -100, NEXT_YEAR))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void overdueGoalCanStillBeCompletedButNotMovedToAnotherPastDate() throws Exception {
        // 만든 뒤 날짜가 지나 버린 목표. 화면으로는 만들 수 없으니 저장소에 바로 넣는다.
        SavingGoal overdue = goalRepository.save(SavingGoal.builder()
                .memberId(memberId)
                .title("지나간 목표")
                .targetAmount(BigDecimal.valueOf(500000))
                .currentAmount(BigDecimal.valueOf(500000))
                .targetDate(TODAY.minusDays(10))
                .status("ACTIVE")
                .priority(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        Map<String, Object> completed = goal("지나간 목표", 500000, 500000, TODAY.minusDays(10).toString());
        completed.put("status", "COMPLETED");
        send(patch("/api/goals/{id}", overdue.getId()), completed)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        send(patch("/api/goals/{id}", overdue.getId()), goal("지나간 목표", 500000, 500000, TODAY.minusDays(20).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void budgetAndSimulationRejectNonsenseNumbers() throws Exception {
        send(post("/api/assets/budgets/monthly"), Map.of("incomeAmount", 3000000, "livingBudgetAmount", 900000))
                .andExpect(status().isOk());
        send(post("/api/assets/budgets/monthly"), Map.of("incomeAmount", -1, "livingBudgetAmount", -5))
                .andExpect(status().isBadRequest());

        send(post("/api/expenses/saving-simulation"), Map.of("categoryReductionRates", Map.of("카페", 20), "fixedSavingAmount", 100000))
                .andExpect(status().isOk());
        send(post("/api/expenses/saving-simulation"), Map.of("categoryReductionRates", Map.of("카페", 500)))
                .andExpect(status().isBadRequest());
        send(post("/api/expenses/saving-simulation"), Map.of("fixedSavingAmount", -1))
                .andExpect(status().isBadRequest());
    }

    @Test
    void futureDatedTradeIsRejected() throws Exception {
        send(post("/api/transactions"), trade(PAST)).andExpect(status().isOk());
        send(post("/api/transactions"), trade(FUTURE))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void coachMessageHasALengthLimit() throws Exception {
        send(post("/api/ai/financial-coach/chat"), Map.of("message", "가".repeat(500))).andExpect(status().isOk());
        send(post("/api/ai/financial-coach/chat"), Map.of("message", "가".repeat(501)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    private Map<String, Object> expense(Object amount, String spentDate) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("category", "식비");
        body.put("merchant", "검증 식당");
        body.put("amount", amount);
        body.put("spentDate", spentDate);
        return body;
    }

    private Map<String, Object> goal(String title, int target, int current, String targetDate) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", title);
        body.put("targetAmount", target);
        body.put("currentAmount", current);
        body.put("targetDate", targetDate);
        body.put("priority", 1);
        return body;
    }

    private Map<String, Object> trade(String date) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("symbol", "005930");
        body.put("transactionType", "BUY");
        body.put("quantity", 1);
        body.put("price", 70000);
        body.put("transactionDate", date);
        return body;
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, Object body)
            throws Exception {
        return mockMvc.perform(request
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .content(json(body)));
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
