package com.stockflow.expense.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CardSmsParserTest {

    private final CardSmsParser parser = new CardSmsParser();

    @Test
    @DisplayName("한 줄짜리 승인 문자에서 금액·날짜·가게를 읽는다")
    void parsesSingleLineMessage() {
        List<CardSmsParser.Parsed> parsed = parser.parse("[Web발신] 신한카드 5,600원 승인 09/11 08:32 메가커피");

        assertThat(parsed).hasSize(1);
        assertThat(parsed.get(0).amount()).isEqualByComparingTo(BigDecimal.valueOf(5600));
        assertThat(parsed.get(0).merchant()).isEqualTo("메가커피");
        assertThat(parsed.get(0).issuer()).isEqualTo("신한");
        assertThat(parsed.get(0).date().getMonthValue()).isEqualTo(9);
        assertThat(parsed.get(0).date().getDayOfMonth()).isEqualTo(11);
    }

    @Test
    @DisplayName("여러 건을 한 번에 붙여넣으면 건별로 나눈다")
    void parsesMultiplePastedMessages() {
        String pasted = """
                [Web발신] 신한카드 5,600원 승인 09/11 08:32 메가커피
                [Web발신] 신한카드 8,000원 승인 09/11 12:14 김밥천국
                [Web발신] 신한카드 18,900원 승인 09/11 19:40 배달의민족
                """;

        List<CardSmsParser.Parsed> parsed = parser.parse(pasted);

        assertThat(parsed).hasSize(3);
        assertThat(parsed).extracting(CardSmsParser.Parsed::merchant)
                .containsExactly("메가커피", "김밥천국", "배달의민족");
        assertThat(parsed).extracting(CardSmsParser.Parsed::amount)
                .containsExactly(
                        BigDecimal.valueOf(5600),
                        BigDecimal.valueOf(8000),
                        BigDecimal.valueOf(18900));
    }

    @Test
    @DisplayName("여러 줄로 된 문자 한 건도 한 건으로 읽는다")
    void parsesMultiLineSingleMessage() {
        String message = """
                [Web발신]
                KB국민카드 홍길동
                5,600원 일시불
                09/11 08:32
                메가커피
                """;

        List<CardSmsParser.Parsed> parsed = parser.parse(message);

        assertThat(parsed).hasSize(1);
        assertThat(parsed.get(0).amount()).isEqualByComparingTo(BigDecimal.valueOf(5600));
        assertThat(parsed.get(0).merchant()).isEqualTo("메가커피");
    }

    @Test
    @DisplayName("누적 사용액은 결제 금액으로 읽지 않는다")
    void ignoresRunningTotalAmount() {
        List<CardSmsParser.Parsed> parsed =
                parser.parse("[Web발신] 롯데카드 5,600원 승인 09/11 08:32 메가커피 누적 1,234,500원");

        assertThat(parsed).hasSize(1);
        assertThat(parsed.get(0).amount()).isEqualByComparingTo(BigDecimal.valueOf(5600));
        assertThat(parsed.get(0).merchant()).isEqualTo("메가커피");
    }

    @Test
    @DisplayName("승인취소 문자는 소비가 아니므로 건너뛴다")
    void skipsCancellation() {
        assertThat(parser.parse("[Web발신] 신한카드 5,600원 승인취소 09/11 09:02 메가커피")).isEmpty();
    }

    @Test
    @DisplayName("하루 앞선 날짜는 시계 차이로 보고 올해로 둔다")
    void keepsSlightlyFutureDateInCurrentYear() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        String message = "신한카드 5,600원 승인 %d/%d 08:32 메가커피"
                .formatted(tomorrow.getMonthValue(), tomorrow.getDayOfMonth());

        List<CardSmsParser.Parsed> parsed = parser.parse(message);

        assertThat(parsed).hasSize(1);
        assertThat(parsed.get(0).date()).isEqualTo(tomorrow);
    }

    @Test
    @DisplayName("한참 미래가 되는 날짜는 작년 것으로 읽는다 (1월에 받은 12월 문자)")
    void rollsBackFarFutureMonthDay() {
        LocalDate farAhead = LocalDate.now().plusMonths(3);
        String message = "신한카드 5,600원 승인 %d/%d 08:32 메가커피"
                .formatted(farAhead.getMonthValue(), farAhead.getDayOfMonth());

        List<CardSmsParser.Parsed> parsed = parser.parse(message);

        assertThat(parsed).hasSize(1);
        assertThat(parsed.get(0).date()).isEqualTo(farAhead.minusYears(1));
    }

    @Test
    @DisplayName("금액이 없는 글은 결제 문자로 보지 않는다")
    void ignoresNonPaymentText() {
        assertThat(parser.parse("오늘 점심 뭐 먹지")).isEmpty();
    }
}
