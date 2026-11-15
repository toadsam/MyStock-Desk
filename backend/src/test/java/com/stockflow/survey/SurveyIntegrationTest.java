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
                .containsExactlyInAnyOrder("SEPARATOR", "id", "path", "satisfaction", "nps", "best", "pain", "whyNot", "wouldHelp", "comment", "createdAt");
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
    void answersOutsideTheAllowedShapeAreRefused() throws Exception {
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "MAYBE"))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("satisfaction", 3))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "satisfaction", 6))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "nps", 11))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "best", List.of("가|나")))).andExpect(status().isBadRequest());
        mockMvc.perform(submit("10.1.0.3", Map.of("path", "USED", "best", List.of("x".repeat(41))))).andExpect(status().isBadRequest());
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
        mockMvc.perform(submit("10.1.1.1", Map.of("path", "USED", "satisfaction", 5, "nps", 10, "best", List.of("AI 코치", "목표 모으기"), "comment", "최고")))
                .andExpect(status().isOk());
        mockMvc.perform(submit("10.1.1.2", Map.of("path", "USED", "satisfaction", 2, "nps", 3, "best", List.of("AI 코치"), "pain", List.of("화면이 느려요"))))
                .andExpect(status().isOk());
        mockMvc.perform(submit("10.1.1.3", Map.of("path", "LOOKED", "whyNot", List.of("구글 로그인이 부담"))))
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
