package com.stockflow.coach.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CoachAnswerGuardTest {

    private static final String SOURCES = """
            ## 이번 달 소비
            - 오늘 날짜: 2026-11-11
            - 이번 달 총 소비: 123,400원
            - 항목 카페: 45,000원 (9건, 전체의 36.5%)
            - 이번 달 남은 생활비: 12,790원
            """;

    @Test
    @DisplayName("자료에 있는 숫자만 쓴 답은 통과한다")
    void acceptsNumbersFromSources() {
        String answer = "이번 달에는 123,400원을 썼고, 그중 카페가 45,000원으로 36.5%예요. 남은 생활비는 12,790원이에요.";
        assertThat(CoachAnswerGuard.firstUnknownNumber(answer, SOURCES)).isNull();
    }

    @Test
    @DisplayName("콤마가 없어도 같은 숫자로 본다")
    void treatsCommaAsFormatting() {
        assertThat(CoachAnswerGuard.firstUnknownNumber("남은 생활비는 12790원이에요.", SOURCES)).isNull();
    }

    @Test
    @DisplayName("계산해서 만든 숫자는 걸린다")
    void rejectsComputedNumbers() {
        // 123,400 - 45,000 = 78,400. 맞는 계산이어도 자료에 없는 숫자다.
        assertThat(CoachAnswerGuard.firstUnknownNumber("카페를 빼면 78,400원이에요.", SOURCES)).isEqualTo("78,400");
    }

    @Test
    @DisplayName("한글 단위로 어림한 금액은 걸린다")
    void rejectsRoundedKoreanAmounts() {
        assertThat(CoachAnswerGuard.firstUnknownNumber("남은 생활비는 약 1만 3천원이에요.", SOURCES)).isNotNull();
        assertThat(CoachAnswerGuard.firstUnknownNumber("카페에 4만원 넘게 썼어요.", SOURCES)).isNotNull();
    }

    @Test
    @DisplayName("사용자가 질문에 쓴 숫자를 되받아 쓰는 것은 괜찮다")
    void allowsNumbersFromTheQuestion() {
        String sources = SOURCES + "\n3만원짜리 운동화를 사도 될까? 150000원은?";
        assertThat(CoachAnswerGuard.firstUnknownNumber("3만원짜리는 남은 생활비 12,790원보다 커요.", sources)).isNull();
        assertThat(CoachAnswerGuard.firstUnknownNumber("150,000원은 남은 생활비보다 커요.", sources)).isNull();
    }

    @Test
    @DisplayName("두 자리 이하 숫자와 100 은 검사하지 않는다")
    void ignoresSmallNumbers() {
        assertThat(CoachAnswerGuard.firstUnknownNumber("2가지만 줄여도 100% 에 가까워져요. 10일만 해 봐요.", SOURCES)).isNull();
    }

    @Test
    @DisplayName("사라, 팔라, 오를 것이다 같은 말은 투자 조언으로 본다")
    void detectsInvestmentAdvice() {
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("지금 삼성전자를 매수하세요.")).isTrue();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("이 종목은 파는 게 좋아요.")).isTrue();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("곧 오를 가능성이 커요.")).isTrue();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("남는 돈은 ETF 에 투자하세요.")).isTrue();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("추천 종목을 알려 드릴게요.")).isTrue();
    }

    @Test
    @DisplayName("숫자를 알려 주거나 거절하는 말은 투자 조언이 아니다")
    void allowsNeutralInvestmentTalk() {
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("투자 판단은 제가 대신해 드릴 수 없어요.")).isFalse();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("이번 달 투자 계획에서 남은 금액은 50,000원이에요.")).isFalse();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("투자 평가 금액은 1,200,000원이고 누적 수익률은 3.2%예요.")).isFalse();
        assertThat(CoachAnswerGuard.looksLikeInvestmentAdvice("카페 지출을 조금 줄이는 게 좋아요.")).isFalse();
    }
}
