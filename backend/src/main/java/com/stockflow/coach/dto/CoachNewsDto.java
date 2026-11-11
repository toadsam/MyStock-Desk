package com.stockflow.coach.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 질문에 나온 종목의 최근 기사. 답 아래에 카드로 보여 준다.
 *
 * <p>기사는 모델이 쓰거나 고른 것이 아니다. 뉴스 검색 결과의 제목과 언론사를 그대로, 최신순으로 담는다.
 * 좋은 소식인지 나쁜 소식인지는 표시하지 않는다.
 */
public record CoachNewsDto(
        String stockName,
        String symbol,
        List<Item> items
) {
    public record Item(String title, String source, String url, LocalDateTime publishedAt) {
    }
}
