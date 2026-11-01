package com.stockflow.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** 배포 전 안전장치 둘: 헬스체크는 로그인 없이 열려 있고, 로그인은 연달아 틀리면 잠긴다. */
@SpringBootTest(properties = "stockflow.auth.login.max-failures=3")
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AuthHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void healthIsPublicAndReportsDatabase() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.db").value("UP"));
    }

    @Test
    void protectedEndpointStillNeedsToken() throws Exception {
        mockMvc.perform(get("/api/goals"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void repeatedWrongPasswordsLockLoginEvenWithTheRightOne() throws Exception {
        register("lock@test.com", "correct-pass-1");

        for (int i = 0; i < 3; i++) {
            login("lock@test.com", "wrong-pass")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
        }

        login("lock@test.com", "correct-pass-1")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("TOO_MANY_REQUESTS"));

        // 다른 이메일은 영향이 없다. 열쇠가 주소+이메일이라서다.
        register("other@test.com", "correct-pass-2");
        login("other@test.com", "correct-pass-2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString());
    }

    @Test
    void successfulLoginClearsEarlierFailures() throws Exception {
        register("reset@test.com", "correct-pass-3");
        login("reset@test.com", "wrong").andExpect(status().isBadRequest());
        login("reset@test.com", "wrong").andExpect(status().isBadRequest());
        login("reset@test.com", "correct-pass-3").andExpect(status().isOk());
        // 성공으로 기록이 지워졌으니 다시 두 번 틀려도 아직 잠기지 않는다.
        login("reset@test.com", "wrong").andExpect(status().isBadRequest());
        login("reset@test.com", "wrong").andExpect(status().isBadRequest());
        login("reset@test.com", "correct-pass-3").andExpect(status().isOk());
    }

    @Test
    void unknownEmailCountsTheSameAsWrongPassword() throws Exception {
        for (int i = 0; i < 3; i++) {
            login("nobody@test.com", "whatever").andExpect(status().isBadRequest());
        }
        login("nobody@test.com", "whatever").andExpect(status().isTooManyRequests());
    }

    private void register(String email, String password) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("name", "테스트", "email", email, "password", password))))
                .andExpect(status().isOk());
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))));
    }
}
