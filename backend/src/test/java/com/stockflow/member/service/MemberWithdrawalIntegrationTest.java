package com.stockflow.member.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** 탈퇴하면 그 사람의 것은 하나도 남지 않고, 다른 사람의 것은 하나도 건드리지 않는다. */
@SpringBootTest
@AutoConfigureMockMvc
class MemberWithdrawalIntegrationTest {

    /** 회원 번호 칸이 없어도 되는 표. 모두가 같이 보는 시세·뉴스·종목, 회원 자신, 그리고 부모 번호로 묶여 따로 지우는 표다. */
    private static final Set<String> NOT_MEMBER_OWNED = Set.of(
            "Member", "RevokedToken",
            "Stock", "PricePoint", "MarketIndex", "SectorPerformance", "News", "Earnings", "AiInsight",
            "Holding", "Execution");

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Seoul"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EntityManager entityManager;

    @Test
    void withdrawalRemovesTheMemberAndEverythingTheyRecorded() throws Exception {
        String leaverEmail = "leaver-" + System.nanoTime() + "@test.com";
        String leaver = register(leaverEmail);
        String stayer = register("stayer-" + System.nanoTime() + "@test.com");
        long leaverId = memberId(leaver);
        long stayerId = memberId(stayer);
        recordSomething(leaver);
        recordSomething(stayer);

        // 지울 것이 실제로 있어야 지웠다는 말이 성립한다.
        assertTrue(rows("Expense", leaverId) > 0);
        assertTrue(rows("SavingGoal", leaverId) > 0);
        assertTrue(rows("FinancialAccount", leaverId) > 0);
        assertTrue(rows("InvestmentTransaction", leaverId) > 0);
        long leaverPortfolioId = portfolioId(leaverId);
        assertTrue(holdings(leaverPortfolioId) > 0);

        mockMvc.perform(delete("/api/members/me").header("Authorization", bearer(leaver)))
                .andExpect(status().isOk());

        List<String> leftovers = new ArrayList<>();
        for (EntityType<?> entity : entityManager.getMetamodel().getEntities()) {
            if (MemberWithdrawalService.hasMemberColumn(entity) && rows(entity.getName(), leaverId) > 0) {
                leftovers.add(entity.getName());
            }
        }
        assertEquals(List.of(), leftovers, "탈퇴한 회원의 줄이 남은 표");
        assertEquals(0, holdings(leaverPortfolioId));
        assertEquals(0, count("select count(m) from Member m where m.id = :id", "id", leaverId));

        // 쓰던 토큰은 끝났고, 같은 이메일로 처음부터 다시 가입할 수 있다.
        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(leaver)))
                .andExpect(status().isUnauthorized());
        register(leaverEmail);

        // 남은 사람의 기록은 그대로다.
        assertTrue(rows("Expense", stayerId) > 0);
        assertTrue(rows("SavingGoal", stayerId) > 0);
        assertTrue(holdings(portfolioId(stayerId)) > 0);
        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(stayer)))
                .andExpect(status().isOk());
    }

    @Test
    void demoAccountCannotBeDeleted() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(json(Map.of("email", "investor@stockflow.com", "password", "stockflow1234"))))
                .andExpect(status().isOk())
                .andReturn();
        String demo = data(login).path("accessToken").asText();

        mockMvc.perform(delete("/api/members/me").header("Authorization", bearer(demo)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(demo)))
                .andExpect(status().isOk());
    }

    @Test
    void withdrawalNeedsALogin() throws Exception {
        mockMvc.perform(delete("/api/members/me")).andExpect(status().isUnauthorized());
    }

    /**
     * 표가 새로 생기면 둘 중 하나여야 한다: 회원 번호 칸이 있어서 탈퇴 때 저절로 지워지거나, 위 목록에 이유와 함께 적혀 있거나.
     * 어느 쪽도 아니면 탈퇴한 사람의 기록이 그 표에 남는다.
     */
    @Test
    void everyTableIsEitherOwnedByAMemberOrKnownNotToBe() {
        List<String> unclassified = entityManager.getMetamodel().getEntities().stream()
                .filter(entity -> !MemberWithdrawalService.hasMemberColumn(entity))
                .map(EntityType::getName)
                .filter(name -> !NOT_MEMBER_OWNED.contains(name))
                .sorted()
                .toList();
        assertEquals(List.of(), unclassified, "회원 번호 칸도 없고 예외 목록에도 없는 표");
    }

    private void recordSomething(String token) throws Exception {
        send(token, "/api/expenses", Map.of(
                "category", "식비", "merchant", "학식", "amount", 5500, "spentDate", TODAY.toString()));
        send(token, "/api/goals", Map.of(
                "title", "여행 자금", "targetAmount", 1000000, "currentAmount", 100000,
                "targetDate", TODAY.plusDays(90).toString(), "status", "ACTIVE", "priority", 1));
        send(token, "/api/assets/accounts", Map.of(
                "name", "생활비 통장", "accountType", "SAVINGS", "institutionName", "MyWave Bank", "balance", 300000));
        send(token, "/api/transactions", Map.of(
                "symbol", "005930", "stockName", "삼성전자", "transactionType", "BUY", "quantity", 1,
                "price", 78600, "fee", 0, "tax", 0, "transactionDate", TODAY.minusDays(1).toString()));
    }

    private void send(String token, String path, Map<String, Object> body) throws Exception {
        mockMvc.perform(post(path)
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(body)))
                .andExpect(status().isOk());
    }

    private long rows(String entityName, long memberId) {
        return count("select count(x) from " + entityName + " x where x." + MemberWithdrawalService.MEMBER_COLUMN + " = :id", "id", memberId);
    }

    private long holdings(long portfolioId) {
        return count("select count(h) from Holding h where h.portfolioId = :id", "id", portfolioId);
    }

    private long portfolioId(long memberId) {
        return entityManager.createQuery("select p.id from Portfolio p where p.memberId = :id", Long.class)
                .setParameter("id", memberId)
                .getSingleResult();
    }

    private long count(String query, String name, long value) {
        return entityManager.createQuery(query, Long.class).setParameter(name, value).getSingleResult();
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of("name", "테스트", "email", email, "password", "withdraw-pass-1"))))
                .andExpect(status().isOk())
                .andReturn();
        return data(result).path("accessToken").asText();
    }

    private long memberId(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/members/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        return data(result).path("id").asLong();
    }

    private JsonNode data(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
