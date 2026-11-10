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
import org.springframework.test.web.servlet.MockMvc;

/**
 * 비밀번호 로그인을 끈 서버. 화면이 칸을 숨기는 것과 별개로, 주소를 직접 불러도 가입과 로그인이 되지 않아야 한다.
 */
@SpringBootTest(properties = "stockflow.auth.password.enabled=false")
@AutoConfigureMockMvc
class GoogleOnlyLoginIntegrationTest {

    private static final String MESSAGE = "지금은 구글 계정으로만 로그인할 수 있어요.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void configTellsTheLoginScreenToHideThePasswordForm() throws Exception {
        mockMvc.perform(get("/api/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.passwordLoginEnabled").value(false));
    }

    @Test
    void registeringWithAPasswordIsRefused() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "테스트", "email", "closed-" + System.nanoTime() + "@test.com", "password", "closed-pass-1"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.error.message").value(MESSAGE));
    }

    @Test
    void evenTheDemoAccountCannotLogInWithItsPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "investor@stockflow.com", "password", "stockflow1234"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.message").value(MESSAGE));
    }
}
