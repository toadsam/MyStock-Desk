package com.stockflow.survey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.survey.entity.SurveyResponse;
import com.stockflow.survey.repository.SurveyResponseRepository;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * 만족도 설문: 로그인 없이 보낼 수 있고, 누가 보냈는지 남지 않고, 한 주소가 쏟아붓지 못하고, 결과는 관리자만 본다.
 */
@SpringBootTest(properties = {
        "stockflow.survey.admin-emails=survey-admin@test.com, Other-Admin@Test.com",
        "stockflow.survey.per-address-per-hour=3"
})
@AutoConfigureMockMvc
class SurveyIntegrationTest {

    private static final String ADMIN_EMAIL = "survey-admin@test.com";
    private static final String PASSWORD = "survey-pass-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SurveyResponseRepository repository;

    @BeforeEach
    void emptyTheTable() {
        repository.deleteAll();
    }

    @Test
    void anyoneCanSubmitWithoutLoggingInAndTheAnswerIsStoredWithoutAnIdentity() throws Exception {
        mockMvc.perform(submit("10.1.0.1", Map.of(
                        "path", "USED", "satisfaction", 4, "nps", 9,
                        "best", List.of("오늘 써도 되는 돈", "AI 코치"), "pain", List.of("화면이 느려요"),
                        "comment", "  좋아요  ")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(repository.findAll()).singleElement().satisfies(saved -> {
            assertThat(saved.getPath()).isEqualTo("USED");
            assertThat(saved.getSatisfaction()).isEqualTo(4);
            assertThat(saved.getNps()).isEqualTo(9);
            assertThat(saved.getBest()).isEqualTo("오늘 써도 되는 돈|AI 코치");
            assertThat(saved.getPain()).isEqualTo("화면이 느려요");
            assertThat(saved.getComment()).isEqualTo("좋아요");
            assertThat(saved.getCreatedAt()).isNotNull();
        });
        // 답한 사람을 알아볼 칸이 표에 없다: 회원 번호도 접속 주소도 저장하지 않는다.
        assertThat(SurveyResponse.class.getDeclaredFields())
                .extracting(java.lang.reflect.Field::getName)
                .containsExactlyInAnyOrder("SEPARATOR", "id", "path", "satisfaction", "nps", "best", "pain", "whyNot", "wouldHelp",
                        "situation", "invest", "spendChange", "usagePeriod", "payFeatures", "payPrice", "comment", "createdAt");
    }

    @Test
    void someoneWhoOnlyLookedCannotMoveTheSatisfactionAverage() throws Exception {
        mockMvc.perform(submit("10.1.0.2", Map.of(
                        "path", "LOOKED", "satisfaction", 1, "nps", 0, "best", List.of("끼워 넣은 답"),
                        "whyNot", List.of("구글 로그인이 부담"), "wouldHelp", List.of("로그인 없이 써 보기"))))
                .andExpect(status().isOk());

        assertThat(repository.findAll()).singleElement().satisfies(saved -> {
            assertThat(saved.getSatisfaction()).isNull();
            assertThat(saved.getNps()).isNull();
            assertThat(saved.getBest()).isNull();
            assertThat(saved.getWhyNot()).isEqualTo("구글 로그인이 부담");
            assertThat(saved.getWouldHelp()).isEqualTo("로그인 없이 써 보기");
            assertThat(saved.getComment()).isNull();
        });
    }

    @Test
    void theNewerQuestionsAreStoredAndSpendChangeOnlyForSomeoneWhoUsedIt() throws Exception {
        mockMvc.perform(submit("10.1.0.6", Map.of(
                        "path", "USED", "satisfaction", 4, "situation", "대학생 (알바)", "invest", "관심만 있어요", "spendChange", "덜 쓰게 됐어요")))
                .andExpect(status().isOk());
        mockMvc.perform(submit("10.1.0.7", Map.of(
                        "path", "LOOKED", "situation", " 사회초년생 ", "invest", "안 해요", "spendChange", "덜 쓰게 됐어요")))
                .andExpect(status().isOk());

        List<SurveyResponse> saved = repository.findAll();
        assertThat(saved).filteredOn(response -> "USED".equals(response.getPath())).singleElement().satisfies(response -> {
            assertThat(response.getSituation()).isEqualTo("대학생 (알바)");
            assertThat(response.getInvest()).isEqualTo("관심만 있어요");
            assertThat(response.getSpendChange()).isEqualTo("덜 쓰게 됐어요");
        });
        // 써 보지 않은 사람에게 "달라졌나요"는 묻지 않으니, 보내 와도 버린다.
        assertThat(saved).filteredOn(response -> "LOOKED".equals(response.getPath())).singleElement().satisfies(response -> {
            assertThat(response.getSituation()).isEqualTo("사회초년생");
            assertThat(response.getInvest()).isEqualTo("안 해요");
            assertThat(response.getSpendChange()).isNull();
        });
    }

    @Test
    void payIntentQuestionsAreStoredAndCountedButUsagePeriodOnlyForSomeoneWhoUsedIt() throws Exception {
        mockMvc.perform(submit("10.1.0.9", Map.of(
                        "path", "USED", "satisfaction", 4, "usagePeriod", "일주일쯤",
                        "payFeatures", List.of("캡처 분석 무제한", "월간 소비 리포트"), "payPrice", "3,000원")))
                .andExpect(status().isOk());
        mockMvc.perform(submit("10.1.0.10", Map.of(
                        "path", "LOOKED", "usagePeriod", "2주 넘게", "payFeatures", List.of("캡처 분석 무제한"), "payPrice", "무료만 쓸래요")))
                .andExpect(status().isOk());

        List<SurveyResponse> saved = repository.findAll();
        assertThat(saved).filteredOn(response -> "USED".equals(response.getPath())).singleElement().satisfies(response -> {
            assertThat(response.getUsagePeriod()).isEqualTo("일주일쯤");
            assertThat(response.getPayFeatures()).isEqualTo("캡처 분석 무제한|월간 소비 리포트");
            assertThat(response.getPayPrice()).isEqualTo("3,000원");
        });
        // 써 보지 않은 사람에게 "며칠 써 봤나요"는 묻지 않으니 버린다. 지불 의향은 모두에게 묻는다.
        assertThat(saved).filteredOn(response -> "LOOKED".equals(response.getPath())).singleElement().satisfies(response -> {
            assertThat(response.getUsagePeriod()).isNull();
            assertThat(response.getPayFeatures()).isEqualTo("캡처 분석 무제한");
            assertThat(response.getPayPrice()).isEqualTo("무료만 쓸래요");
        });

        JsonNode data = objectMapper.readTree(mockMvc.perform(get("/api/surveys/summary").header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).path("data");
        assertThat(data.path("payFeatures").get(0).path("option").asText()).isEqualTo("캡처 분석 무제한");
        assertThat(data.path("payFeatures").get(0).path("count").asLong()).isEqualTo(2);
        assertThat(data.path("payPrice")).hasSize(2);
        assertThat(data.path("usagePeriod")).hasSize(1);
    }

    @Test
    void anOlderScreenThatDoesNotSendTheNewerQuestionsStillWorks() throws Exception {
        mockMvc.perform(submit("10.1.0.8", Map.of("path", "USED", "satisfaction", 3, "nps", 7)))
                .andExpect(status().isOk());

        assertThat(repository.findAll()).singleElement().satisfies(saved -> {
            assertThat(saved.getSituation()).isNull();
            assertThat(saved.getInvest()).isNull();
            assertThat(saved.getSpendChange()).isNull();
        });
    }

    @Test
    void answersOutsideTheAllowedShapeAreRefused() throws Exception {
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "MAYBE"))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("satisfaction", 3))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "satisfaction", 6))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "nps", 11))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "best", List.of("가|나")))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "best", List.of("x".repeat(41))))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "situation", "x".repeat(41)))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "invest", "가|나"))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "comment", "가".repeat(301))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("한마디는 300자 이내로 적어 주세요."));

        assertThat(repository.count()).isZero();
    }

    @Test
    void oneAddressCannotFloodTheSurvey() throws Exception {
        for (int attempt = 0; attempt < 3; attempt++) {
            mockMvc.perform(submit("10.1.0.4", Map.of("path", "LOOKED"))).andExpect(status().isOk());
        }
        mockMvc.perform(submit("10.1.0.4", Map.of("path", "LOOKED")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.message").value("설문을 이미 여러 번 보내셨어요. 잠시 뒤에 다시 시도해 주세요."));
        // 다른 주소는 그대로 받는다.
        mockMvc.perform(submit("10.1.0.5", Map.of("path", "LOOKED"))).andExpect(status().isOk());

        assertThat(repository.count()).isEqualTo(4);
    }

    @Test
    void onlyAnAdminAccountCanReadTheResults() throws Exception {
        mockMvc.perform(get("/api/surveys/summary")).andExpect(status().isUnauthorized());

        String stranger = register("survey-stranger-" + System.nanoTime() + "@test.com");
        mockMvc.perform(get("/api/surveys/summary").header("Authorization", "Bearer " + stranger))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.message").value("설문 결과는 관리자만 볼 수 있어요."));
    }

    @Test
    void theSummaryCountsAveragesAndRanksTheAnswers() throws Exception {
        mockMvc.perform(submit("10.1.1.1", Map.of("path", "USED", "satisfaction", 5, "nps", 10, "best", List.of("AI 코치", "목표 모으기"), "comment", "최고",
                        "situation", "대학생 (용돈)", "invest", "관심만 있어요", "spendChange", "덜 쓰게 됐어요")))
                .andExpect(status().isOk());
        mockMvc.perform(submit("10.1.1.2", Map.of("path", "USED", "satisfaction", 2, "nps", 3, "best", List.of("AI 코치"), "pain", List.of("화면이 느려요"),
                        "situation", "대학생 (용돈)", "invest", "안 해요", "spendChange", "그대로예요")))
                .andExpect(status().isOk());
        mockMvc.perform(submit("10.1.1.3", Map.of("path", "LOOKED", "whyNot", List.of("구글 로그인이 부담"), "situation", "사회초년생", "invest", "관심만 있어요")))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/surveys/summary").header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");

        assertThat(data.path("total").asLong()).isEqualTo(3);
        assertThat(data.path("used").asLong()).isEqualTo(2);
        assertThat(data.path("looked").asLong()).isEqualTo(1);
        assertThat(data.path("satisfactionAverage").asDouble()).isEqualTo(3.5);
        assertThat(data.path("satisfactionCounts")).extracting(JsonNode::asLong).containsExactly(0L, 1L, 0L, 0L, 1L);
        assertThat(data.path("npsAverage").asDouble()).isEqualTo(6.5);
        // 추천 1명(10점), 비추천 1명(3점) → (1 - 1) / 2 = 0
        assertThat(data.path("npsScore").asInt()).isZero();
        assertThat(data.path("best").get(0).path("option").asText()).isEqualTo("AI 코치");
        assertThat(data.path("best").get(0).path("count").asLong()).isEqualTo(2);
        assertThat(data.path("whyNot").get(0).path("option").asText()).isEqualTo("구글 로그인이 부담");
        assertThat(data.path("situation").get(0).path("option").asText()).isEqualTo("대학생 (용돈)");
        assertThat(data.path("situation").get(0).path("count").asLong()).isEqualTo(2);
        assertThat(data.path("invest").get(0).path("option").asText()).isEqualTo("관심만 있어요");
        assertThat(data.path("invest").get(0).path("count").asLong()).isEqualTo(2);
        assertThat(data.path("spendChange")).hasSize(2);
        // 상황별: 대학생(용돈) 2명 모두 써 봤고 만족도 평균 3.5, 사회초년생 1명은 구경만 해서 만족도가 없다.
        JsonNode students = data.path("bySituation").get(0);
        assertThat(students.path("option").asText()).isEqualTo("대학생 (용돈)");
        assertThat(students.path("responses").asLong()).isEqualTo(2);
        assertThat(students.path("used").asLong()).isEqualTo(2);
        assertThat(students.path("satisfactionAverage").asDouble()).isEqualTo(3.5);
        assertThat(students.path("npsScore").asInt()).isZero();
        JsonNode starters = data.path("bySituation").get(1);
        assertThat(starters.path("option").asText()).isEqualTo("사회초년생");
        assertThat(starters.path("used").asLong()).isZero();
        assertThat(starters.path("satisfactionAverage").isNull()).isTrue();
        assertThat(data.path("comments")).hasSize(1);
        assertThat(data.path("comments").get(0).path("text").asText()).isEqualTo("최고");
    }

    private MockHttpServletRequestBuilder submit(String address, Map<String, Object> body) throws Exception {
        return post("/api/surveys")
                .with(request -> {
                    request.setRemoteAddr(address);
                    return request;
                })
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(body));
    }

    /** 관리자 계정은 테스트끼리 같이 쓴다. 처음이면 만들고, 이미 있으면 로그인한다. */
    private String adminToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("name", "관리자", "email", ADMIN_EMAIL, "password", PASSWORD))))
                .andReturn();
        if (result.getResponse().getStatus() != 200) {
            result = mockMvc.perform(post("/api/auth/login")
                            .contentType("application/json")
                            .content(objectMapper.writeValueAsString(Map.of("email", ADMIN_EMAIL, "password", PASSWORD))))
                    .andExpect(status().isOk())
                    .andReturn();
        }
        return token(result);
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("name", "테스트", "email", email, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return token(result);
    }

    private String token(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("data").path("accessToken").asText();
    }
}
