package com.stockflow.coach.news;

import static org.assertj.core.api.Assertions.assertThat;

import com.stockflow.stock.entity.Stock;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class StockMentionFinderTest {

    private static final List<Stock> STOCKS = List.of(
            stock("005930", "삼성전자"),
            stock("000660", "SK하이닉스"),
            stock("035420", "NAVER"),
            stock("035720", "카카오"),
            stock("005380", "현대차"),
            stock("005490", "POSCO홀딩스"),
            stock("207940", "삼성바이오로직스"));

    @Test
    @DisplayName("질문에 나온 종목 이름을 찾는다")
    void findsByName() {
        assertThat(symbolOf("지금 삼성전자 사도 돼?")).isEqualTo("005930");
        assertThat(symbolOf("카카오는 요즘 어때")).isEqualTo("035720");
    }

    @Test
    @DisplayName("띄어쓰기, 대소문자, 줄임말, 종목 코드로 물어도 찾는다")
    void findsByAliasAndCode() {
        assertThat(symbolOf("sk 하이닉스 오를까")).isEqualTo("000660");
        assertThat(symbolOf("하닉 더 살까")).isEqualTo("000660");
        assertThat(symbolOf("삼전 팔까")).isEqualTo("005930");
        assertThat(symbolOf("네이버 어때")).isEqualTo("035420");
        assertThat(symbolOf("005930 소식 알려줘")).isEqualTo("005930");
        assertThat(symbolOf("포스코 어때")).isEqualTo("005490");
    }

    @Test
    @DisplayName("이름이 겹치면 긴 쪽으로 읽는다")
    void prefersTheLongerName() {
        assertThat(symbolOf("삼성바이오로직스 어때")).isEqualTo("207940");
        assertThat(symbolOf("삼성바이오 어때")).isEqualTo("207940");
    }

    @Test
    @DisplayName("이름 뒤에 다른 회사 이름이 이어지면 그 종목으로 읽지 않는다")
    void doesNotMistakeOtherCompanies() {
        assertThat(symbolOf("카카오뱅크 사도 돼?")).isNull();
        assertThat(symbolOf("카카오페이 어때")).isNull();
        assertThat(symbolOf("포스코퓨처엠 어때")).isNull();
        assertThat(symbolOf("현대차증권 어때")).isNull();
        // 다른 회사 뒤에 진짜 이름이 따로 나오면 찾는다.
        assertThat(symbolOf("카카오뱅크 말고 카카오는 어때")).isEqualTo("035720");
    }

    @Test
    @DisplayName("종목 이야기가 아니면 찾지 않는다")
    void findsNothingInOrdinaryQuestions() {
        assertThat(symbolOf("이번 달 소비 어땠어?")).isNull();
        assertThat(symbolOf("지금 투자해도 괜찮을까?")).isNull();
        assertThat(symbolOf("테슬라 사도 돼?")).isNull();
        assertThat(symbolOf("")).isNull();
        assertThat(symbolOf(null)).isNull();
    }

    private static String symbolOf(String question) {
        return StockMentionFinder.find(question, STOCKS).map(Stock::getSymbol).orElse(null);
    }

    private static Stock stock(String symbol, String name) {
        return Stock.builder().symbol(symbol).name(name).build();
    }
}
