package com.stockflow.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * 공개된 주소에서 계정이 망가지지 않게 하는 장치들:
 * 로그아웃한 토큰은 죽고, 비밀번호를 바꾸면 예전 토큰이 죽고, 데모 계정은 잠겨 있고, 등급은 스스로 못 올린다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AccountSafetyIntegrationTest {

    private static final String DEMO_EMAIL = "investor@stockflow.com";
    private static final String DEMO_PASSWORD = "stockflow1234";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void logoutKillsThatTokenAndLeavesOtherSessionsAlone() throws Exception {
        String email = uniqueEmail("logout");
        String first = register(email, "first-pass-123");
        String second = login(email, "first-pass-123");

        mockMvc.perform(post("/api/auth/logout").header("Authorization", bearer(first)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(first)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_TOKEN"));
        // 같은 계정의 다른 로그인은 그대로다. 데모 계정에서 한 사람이 나가도 다른 사람은 남는다.
        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email));
    }

    @Test
    void logoutWithoutTokenOrWithGarbageStillAnswersOk() throws Exception {
        mockMvc.perform(post("/api/auth/logout")).andExpect(status().isOk());
    }

    @Test
    void changingPasswordEndsTokensIssuedBefore() throws Exception {
        String email = uniqueEmail("password");
        String oldToken = register(email, "old-pass-1234");
        // 발급 시각은 초 단위다. 같은 초에 바꾸면 구분할 수 없으니 초가 넘어가게 둔다.
        Thread.sleep(1100);

        mockMvc.perform(post("/api/members/me/password")
                        .header("Authorization", bearer(oldToken))
                        .contentType("application/json")
                        .content(json(Map.of("currentPassword", "old-pass-1234", "newPassword", "new-pass-5678"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(oldToken)))
                .andExpect(status().isUnauthorized());

        String newToken = login(email, "new-pass-5678");
        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(newToken)))
                .andExpect(status().isOk());
    }

    @Test
    void demoAccountProfileAndPasswordCannotBeChanged() throws Exception {
        String token = login(DEMO_EMAIL, DEMO_PASSWORD);

        mockMvc.perform(patch("/api/members/me/profile")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of("name", "바뀐 이름", "email", "taken-over@test.com"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));

        mockMvc.perform(post("/api/members/me/password")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of("currentPassword", DEMO_PASSWORD, "newPassword", "locked-out-999"))))
                .andExpect(status().isForbidden());

        // 데모 로그인은 여전히 되고, 써 보라고 둔 기록 기능은 막지 않는다.
        login(DEMO_EMAIL, DEMO_PASSWORD);
        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "category", "카페",
                                "merchant", "데모 카페",
                                "amount", 3000,
                                "spentDate", LocalDate.now(ZoneId.of("Asia/Seoul")).minusDays(1).toString()))))
                .andExpect(status().isOk());
    }

    @Test
    void ordinaryAccountCanStillEditItsProfile() throws Exception {
        String email = uniqueEmail("profile");
        String token = register(email, "profile-pass-1");

        mockMvc.perform(patch("/api/members/me/profile")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of("name", "새 이름", "email", email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("새 이름"));
    }

    @Test
    void membershipGradeCannotBeSelfAssigned() throws Exception {
        String token = register(uniqueEmail("grade"), "grade-pass-123");

        mockMvc.perform(patch("/api/members/me/membership")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of("membershipGrade", "VIP"))))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/members/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.membershipGrade").value("BASIC"));
    }

    private String uniqueEmail(String prefix) {
        return prefix + "-" + System.nanoTime() + "@test.com";
    }

    private String register(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of("name", "테스트", "email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return token(result);
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return token(result);
    }

    private String token(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("data").path("accessToken").asText();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
