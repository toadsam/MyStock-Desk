package com.stockflow.coach;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.coach.service.OpenAiCoachClient;
import com.stockflow.global.exception.ExternalDataException;
import com.stockflow.global.type.ImpactType;
import com.stockflow.news.dto.NewsDto;
import com.stockflow.news.service.GoogleNewsRssProvider;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * 종목을 물으면 판단 대신 최근 기사를 건넨다. 그 기사가 조언이 되지 않게 지키는 것을 확인한다.
 * <ul>
 *   <li>고르지 않는다: 최신순 세 건.</li>
 *   <li>풀어 쓰지 않는다: 기사 제목은 모델로 나가지 않고, 화면용 자료로만 나간다.</li>
 *   <li>호재·악재 표시를 붙이지 않는다.</li>
 * </ul>
 * 뉴스 검색과 모델 호출은 가짜로 바꿔 끼운다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class CoachNewsIntegrationTest {

    private static final LocalDateTime NOW = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OpenAiCoachClient client;

    @MockitoBean
    private GoogleNewsRssProvider newsProvider;

    @Test
    @DisplayName("종목을 물으면 최근 기사 세 건을 최신순으로 붙이고, 기사 제목은 모델로 보내지 않는다")
    void attachesNewestThreeWithoutSendingHeadlinesToTheModel() throws Exception {
        when(newsProvider.search(anyString(), any(), anyInt())).thenReturn(List.of(
                news("이틀 전 기사", "가나일보", NOW.minusDays(2)),
                news("방금 나온 기사", "다라경제", NOW.minusHours(1)),
                news("닷새 전 기사", "마바신문", NOW.minusDays(5)),
                news("어제 기사", "사아뉴스", NOW.minusDays(1)),
                news("방금 나온 기사", "다른 언론사가 받아쓴 같은 제목", NOW.minusHours(3)),
                news("한 달 전 기사", "자차일보", NOW.minusDays(30))));
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("그 판단은 대신할 수 없어요. 대신 삼성전자의 최근 소식을 아래에 모아 두었어요.");

        ask(register(), "지금 삼성전자 사도 돼?")
                .andExpect(jsonPath("$.data.source").value("AI"))
                .andExpect(jsonPath("$.data.news.stockName").value("삼성전자"))
                .andExpect(jsonPath("$.data.news.symbol").value("005930"))
                .andExpect(jsonPath("$.data.news.items.length()").value(3))
                .andExpect(jsonPath("$.data.news.items[0].title").value("방금 나온 기사"))
                .andExpect(jsonPath("$.data.news.items[0].source").value("다라경제"))
                .andExpect(jsonPath("$.data.news.items[0].url").value(startsWith("https://news.google.com/")))
                .andExpect(jsonPath("$.data.news.items[1].title").value("어제 기사"))
                .andExpect(jsonPath("$.data.news.items[2].title").value("이틀 전 기사"))
                // 좋은 소식인지 나쁜 소식인지는 화면으로 나가지 않는다.
                .andExpect(jsonPath("$.data.news.items[0].impactType").doesNotExist());

        ArgumentCaptor<String> query = ArgumentCaptor.forClass(String.class);
        verify(newsProvider, times(1)).search(query.capture(), any(), anyInt());
        assertThat(query.getValue()).isEqualTo("삼성전자 when:7d");

        ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
        verify(client).complete(anyString(), sent.capture());
        assertThat(sent.getValue())
                .contains("삼성전자의 최근 기사 3건이 이 답 바로 아래에 카드로 표시됩니다")
                .doesNotContain("방금 나온 기사")
                .doesNotContain("어제 기사")
                .doesNotContain("다라경제");
    }

    @Test
    @DisplayName("답이 소식을 말하지 않으면 한 줄을 덧붙인다. 모델이 사라고 해도 거절 문장과 소식만 나간다")
    void appendsANewsLineAndStillRefusesAdvice() throws Exception {
        when(newsProvider.search(anyString(), any(), anyInt())).thenReturn(List.of(news("어제 기사", "사아뉴스", NOW.minusDays(1))));
        when(client.isEnabled()).thenReturn(true);
        when(client.complete(anyString(), anyString())).thenReturn("삼성전자는 지금 매수하세요. 곧 오를 가능성이 커요.");

        ask(register(), "삼전 지금 살까?")
                .andExpect(jsonPath("$.data.answer.content").value(startsWith("투자 판단은 제가 대신해 드릴 수 없어요.")))
                .andExpect(jsonPath("$.data.answer.content").value(endsWith("대신 삼성전자의 최근 소식을 아래에 모아 봤어요.")))
                .andExpect(jsonPath("$.data.news.items.length()").value(1));
    }

    @Test
    @DisplayName("AI 가 꺼져 있어도 종목을 물으면 소식을 붙인다")
    void attachesNewsEvenWhenAiIsOff() throws Exception {
        when(newsProvider.search(anyString(), any(), anyInt())).thenReturn(List.of(news("어제 기사", "사아뉴스", NOW.minusDays(1))));

        ask(register(), "카카오 투자해도 돼?")
                .andExpect(jsonPath("$.data.source").value("RULE"))
                .andExpect(jsonPath("$.data.answer.content").value(containsString("투자 판단은 제가 대신해 드릴 수 없어요.")))
                .andExpect(jsonPath("$.data.answer.content").value(endsWith("대신 카카오의 최근 소식을 아래에 모아 봤어요.")))
                .andExpect(jsonPath("$.data.news.stockName").value("카카오"));
    }

    @Test
    @DisplayName("종목 이야기가 아니면 뉴스를 찾지 않는다")
    void doesNotSearchForOrdinaryQuestions() throws Exception {
        ask(register(), "이번 달 소비 어땠어?")
                .andExpect(jsonPath("$.data.news").value(nullValue()));
        ask(register(), "카카오뱅크 사도 돼?")
                .andExpect(jsonPath("$.data.news").value(nullValue()));

        verify(newsProvider, never()).search(anyString(), any(), anyInt());
    }

    @Test
    @DisplayName("뉴스를 가져오지 못해도 코치는 답한다")
    void answersEvenWhenNewsFails() throws Exception {
        when(newsProvider.search(anyString(), any(), anyInt()))
                .thenThrow(new ExternalDataException("NEWS_PROVIDER_ERROR", "실패"));

        ask(register(), "삼성전자 어때?")
                .andExpect(jsonPath("$.data.answer.content").isNotEmpty())
                .andExpect(jsonPath("$.data.news").value(nullValue()));
    }

    @Test
    @DisplayName("같은 종목을 다시 물으면 10분 동안은 뉴스 검색을 다시 하지 않는다")
    void cachesNewsPerStock() throws Exception {
        when(newsProvider.search(anyString(), any(), anyInt())).thenReturn(List.of(news("어제 기사", "사아뉴스", NOW.minusDays(1))));
        String token = register();

        ask(token, "삼성전자 어때?").andExpect(jsonPath("$.data.news.items.length()").value(1));
        ask(token, "삼전 더 살까?").andExpect(jsonPath("$.data.news.items.length()").value(1));

        verify(newsProvider, times(1)).search(anyString(), any(), anyInt());
    }

    private NewsDto news(String title, String source, LocalDateTime publishedAt) {
        return new NewsDto(
                -1L,
                title,
                "요약",
                "실시간 뉴스",
                source + " / Google News RSS",
                "https://news.google.com/rss/articles/" + Math.abs(title.hashCode()),
                "Google News RSS",
                NOW,
                "AGGREGATED",
                false,
                ImpactType.POSITIVE,
                "005930",
                publishedAt,
                80);
    }

    private ResultActions ask(String token, String message) throws Exception {
        return mockMvc.perform(post("/api/ai/financial-coach/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("message", message))))
                .andExpect(status().isOk());
    }

    private String register() throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "소식테스터",
                                "email", "coach-news-" + System.nanoTime() + "@test.com",
                                "password", "stockflow1234"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(body).path("data").path("accessToken").asText();
    }
}
