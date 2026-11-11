package com.stockflow.coach;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.coach.service.FinancialCoachService;
import com.stockflow.coach.service.OpenAiCoachClient;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * AI코치가 지키기로 한 네 가지를 확인한다. 모델 호출은 가짜로 바꿔 끼운다.
 * <ul>
 *   <li>숫자는 서버가 준 것만 쓴다. 모델이 다른 숫자를 쓰면 그 답은 버린다.</li>
 *   <li>투자 조언은 하지 않는다.</li>
 *   <li>이름, 이메일, 가게, 메모, 목표 이름, 계좌 이름은 모델로 나가지 않는다.</li>
 *   <li>하루 횟수를 넘으면 모델을 부르지 않는다.</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class FinancialCoachAiIntegrationTest {

    private static final String NAME = "코치테스터";
    private static final String TODAY = LocalDate.now(ZoneId.of("Asia/Seoul")).toString();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FinancialCoachService coachService;

    @MockitoBean
    private OpenAiCoachClient client;

    @Test
    @DisplayName("AI 가 꺼져 있으면 모델을 부르지 않고 정해진 답을 한다")
    void answersByRuleWhenAiIsOff() throws Exception {
        String token = register("off");

        ask(token, "이번 달 소비 어땠어?")
                .andExpect(jsonPath("$.data.source").value("RULE"))
                .andExpect(jsonPath("$.data.remainingToday").value(nullValue()))
                .andExpect(jsonPath("$.data.answer.content").isNotEmpty());

        verify(client, never()).complete(anyString(), anyString());
    }

    @Test
    @DisplayName("모델에는 숫자와 항목만 나가고, 이름·이메일·가게·메모·목표 이름·계좌 이름은 나가지 않는다")
    void sendsNumbersButNoPersonalText() throws Exception {
        String email = "coach-private-" + System.nanoTime() + "@test.com";
        String token = register(email);
        seedLedger(token);
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("이번 달 카페에 12,000원 썼어요.");

        ask(token, "내 번호는 010-1234-5678 이고 메일은 me@example.com 인데, 이번 달 소비 어땠어?")
                .andExpect(jsonPath("$.data.source").value("AI"))
                .andExpect(jsonPath("$.data.remainingToday").value(29))
                .andExpect(jsonPath("$.data.answer.content").value("이번 달 카페에 12,000원 썼어요."));

        ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
        verify(client).complete(anyString(), sent.capture());
        assertThat(sent.getValue())
                .contains("항목 카페: 12,000원")
                .contains("이번 달 총 소비: 12,000원")
                .contains("주요 목표의 목표 금액: 1,000,000원")
                .contains("이번 달 소비 어땠어?")
                .doesNotContain(NAME)
                .doesNotContain(email)
                .doesNotContain("비밀가게")
                .doesNotContain("비밀메모")
                .doesNotContain("비밀목표")
                .doesNotContain("비밀통장")
                .doesNotContain("비밀은행")
                .doesNotContain("010-1234-5678")
                .doesNotContain("me@example.com");
    }

    @Test
    @DisplayName("모델이 자료에 없는 숫자를 쓰면 그 답을 버리고 정해진 답을 한다")
    void dropsAnswersWithInventedNumbers() throws Exception {
        String token = register("invented");
        seedLedger(token);
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("이번 달 카페에 99,999원 썼어요.");

        ask(token, "이번 달 소비 어땠어?")
                .andExpect(jsonPath("$.data.source").value("RULE"))
                .andExpect(jsonPath("$.data.answer.content").value(not(containsString("99,999"))));
    }

    @Test
    @DisplayName("모델이 사라고 하면 거절 문장으로 바꾼다")
    void replacesInvestmentAdvice() throws Exception {
        String token = register("advice");
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("지금 삼성전자를 매수하세요. 곧 오를 가능성이 커요.");

        ask(token, "지금 투자해도 괜찮을까?")
                .andExpect(jsonPath("$.data.answer.content").value(startsWith("투자 판단은 제가 대신해 드릴 수 없어요.")))
                .andExpect(jsonPath("$.data.answer.content").value(not(containsString("매수하세요"))));
    }

    @Test
    @DisplayName("모델을 부르지 못하면 정해진 답을 한다")
    void fallsBackWhenTheModelFails() throws Exception {
        String token = register("failed");
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn(null);

        ask(token, "목표까지 얼마나 남았어?")
                .andExpect(jsonPath("$.data.source").value("RULE"))
                .andExpect(jsonPath("$.data.answer.content").isNotEmpty());
    }

    @Test
    @DisplayName("하루 횟수를 다 쓰면 모델을 더 부르지 않고 그렇게 알린다")
    void stopsCallingTheModelAfterTheDailyLimit() throws Exception {
        ReflectionTestUtils.setField(coachService, "dailyLimit", 2);
        String token = register("limit");
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("기록을 같이 볼게요.");

        ask(token, "안녕").andExpect(jsonPath("$.data.source").value("AI")).andExpect(jsonPath("$.data.remainingToday").value(1));
        ask(token, "고마워").andExpect(jsonPath("$.data.source").value("AI")).andExpect(jsonPath("$.data.remainingToday").value(0));
        ask(token, "하나만 더")
                .andExpect(jsonPath("$.data.source").value("RULE"))
                .andExpect(jsonPath("$.data.remainingToday").value(0))
                .andExpect(jsonPath("$.data.answer.content").value(startsWith("오늘 받을 수 있는 AI 답변 2번을 다 썼어요.")));

        verify(client, times(2)).complete(anyString(), anyString());
    }

    @Test
    @DisplayName("모든 사람을 합친 하루 상한을 넘으면 다른 사람의 질문도 모델로 가지 않는다")
    void stopsAtTheGlobalLimit() throws Exception {
        ReflectionTestUtils.setField(coachService, "globalDailyLimit", 1);
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("기록을 같이 볼게요.");

        ask(register("first"), "안녕").andExpect(jsonPath("$.data.source").value("AI"));
        ask(register("second"), "안녕").andExpect(jsonPath("$.data.source").value("RULE"));

        verify(client, times(1)).complete(anyString(), anyString());
    }

    private ResultActions ask(String token, String message) throws Exception {
        return mockMvc.perform(post("/api/ai/financial-coach/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(json(Map.of("message", message))))
                .andExpect(status().isOk());
    }

    /** 이름이 붙은 것마다 "비밀…"이라고 적어 둔다. 모델로 나간 글에 이 글자가 없어야 한다. */
    private void seedLedger(String token) throws Exception {
        send(token, "/api/expenses", Map.of(
                "category", "카페",
                "merchant", "비밀가게",
                "amount", 12000,
                "spentDate", TODAY,
                "memo", "비밀메모"));
        send(token, "/api/goals", Map.of(
                "title", "비밀목표",
                "targetAmount", 1000000,
                "currentAmount", 100000,
                "targetDate", LocalDate.now(ZoneId.of("Asia/Seoul")).plusYears(1).toString()));
        send(token, "/api/assets/accounts", Map.of(
                "name", "비밀통장",
                "accountType", "BANK",
                "institutionName", "비밀은행",
                "balance", 500000,
                "includedInAssets", true));
    }

    private void send(String token, String path, Map<String, Object> body) throws Exception {
        mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(json(body)))
                .andExpect(status().isOk());
    }

    private String register(String emailOrTag) throws Exception {
        String email = emailOrTag.contains("@") ? emailOrTag : "coach-" + emailOrTag + "-" + System.nanoTime() + "@test.com";
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of("name", NAME, "email", email, "password", "stockflow1234"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(body).path("data").path("accessToken").asText();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
