package com.stockflow.auth.google;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

/**
 * 구글 로그인의 처음부터 끝까지. 구글 자리에만 테스트용 키를 꽂고, 토큰 검증부터 회원 생성까지는 진짜 코드가 돈다.
 */
@SpringBootTest(properties = "stockflow.auth.google.client-id=" + GoogleTokenFactory.CLIENT_ID)
@AutoConfigureMockMvc
class GoogleLoginIntegrationTest {

    private static final GoogleTokenFactory GOOGLE = new GoogleTokenFactory();

    @TestConfiguration
    static class TestGoogleKeys {
        @Bean
        @Primary
        GoogleKeySource testGoogleKeySource() {
            return GOOGLE.keySource();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void configTellsTheLoginScreenWhichClientIdToUse() throws Exception {
        mockMvc.perform(get("/api/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.googleClientId").value(GoogleTokenFactory.CLIENT_ID));
    }

    @Test
    void firstGoogleLoginCreatesAMemberAndLaterLoginsReturnTheSameOne() throws Exception {
        String subject = "sub-" + System.nanoTime();
        String email = "first-" + System.nanoTime() + "@gmail.com";

        MvcResult first = google(GOOGLE.token(GOOGLE.claims(subject, email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.member.email").value(email))
                .andExpect(jsonPath("$.data.member.name").value("구글 사용자"))
                .andExpect(jsonPath("$.data.member.membershipGrade").value("BASIC"))
                .andExpect(jsonPath("$.data.member.loginProvider").value("GOOGLE"))
                .andReturn();
        JsonNode firstData = data(first);

        // 받은 토큰은 다른 로그인과 똑같이 통하고, 새 회원에게는 빈 포트폴리오가 있다.
        String token = firstData.path("accessToken").asText();
        mockMvc.perform(get("/api/members/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/portfolio").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 구글에서 이메일을 바꿔도 같은 사람이다. 계정 번호로 찾기 때문이다.
        MvcResult second = google(GOOGLE.token(GOOGLE.claims(subject, "renamed-" + email)))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals(firstData.path("member").path("id").asLong(), data(second).path("member").path("id").asLong());
    }

    @Test
    void doesNotMergeIntoAnAccountThatRegisteredWithAPassword() throws Exception {
        String email = "taken-" + System.nanoTime() + "@gmail.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of("name", "먼저 가입", "email", email, "password", "password-first-1"))))
                .andExpect(status().isOk());

        google(GOOGLE.token(GOOGLE.claims("sub-" + System.nanoTime(), email)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("이미 이메일과 비밀번호로 가입한 계정이에요. 비밀번호로 로그인해 주세요."));
    }

    @Test
    void rejectsAnEmailGoogleHasNotVerified() throws Exception {
        Map<String, Object> claims = GOOGLE.claims("sub-" + System.nanoTime(), "unverified-" + System.nanoTime() + "@example.com");
        claims.put("email_verified", false);

        google(GOOGLE.token(claims)).andExpect(status().isBadRequest());
    }

    @Test
    void rejectsForgedAndGarbageCredentials() throws Exception {
        GoogleTokenFactory impostor = new GoogleTokenFactory();
        google(impostor.token(impostor.claims("sub-1", "victim@gmail.com"))).andExpect(status().isBadRequest());
        google("garbage").andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/google").contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void googleAccountHasNoPasswordToLogInWithOrChange() throws Exception {
        String email = "nopass-" + System.nanoTime() + "@gmail.com";
        String token = data(google(GOOGLE.token(GOOGLE.claims("sub-" + System.nanoTime(), email)))
                .andExpect(status().isOk())
                .andReturn()).path("accessToken").asText();

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(json(Map.of("email", email, "password", "any-password-123"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/members/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(json(Map.of("currentPassword", "any-password-123", "newPassword", "new-password-456"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private ResultActions google(String credential) throws Exception {
        return mockMvc.perform(post("/api/auth/google")
                .contentType("application/json")
                .content(json(Map.of("credential", credential))));
    }

    private JsonNode data(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
