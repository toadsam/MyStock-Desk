package com.stockflow.coach.news;

import com.stockflow.stock.entity.Stock;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * 질문에서 종목을 찾는다. 앱이 아는 종목(Stock 표)만 찾는다.
 *
 * <p>모델에게 "어느 회사 이야기인지" 묻지 않고 이름을 글자로 맞춰 본다. 모델이 고른 낱말로 바깥을 검색하게 하면
 * 질문에 심은 말로 엉뚱한 검색을 시킬 수 있고, 틀린 회사의 소식을 보여 줄 수도 있다.
 * 대신 표에 없는 회사는 찾지 못한다.
 */
public final class StockMentionFinder {

    /** 사람들이 흔히 쓰는 줄임말과 다른 표기. 종목 코드로 잇는다. */
    private static final Map<String, List<String>> ALIASES = Map.of(
            "005930", List.of("삼전"),
            "000660", List.of("하이닉스", "하닉", "에스케이하이닉스"),
            "035420", List.of("네이버"),
            "373220", List.of("LG엔솔", "엘지엔솔", "엘지에너지솔루션"),
            "005380", List.of("현대자동차"),
            "005490", List.of("포스코홀딩스", "포스코"),
            "207940", List.of("삼바", "삼성바이오"),
            "010120", List.of("LS일렉트릭", "엘에스일렉트릭"));

    /**
     * 이름 바로 뒤에 이 말이 붙으면 다른 회사다. "카카오뱅크"를 "카카오"로, "포스코퓨처엠"을 "포스코"로 읽지 않는다.
     * 표에 그 회사가 따로 있으면 긴 이름이 먼저 맞으므로 여기까지 오지 않는다.
     */
    private static final List<String> OTHER_COMPANY_SUFFIXES = List.of(
            "뱅크", "페이", "게임즈", "엔터", "헬스케어", "스타일", "우선주", "증권", "퓨처엠", "인터내셔널", "dx", "스틸리온", "엠텍");

    private StockMentionFinder() {
    }

    public static Optional<Stock> find(String question, List<Stock> stocks) {
        if (question == null || question.isBlank() || stocks == null) {
            return Optional.empty();
        }
        String text = normalize(question);
        Stock best = null;
        int bestLength = 0;
        int bestPosition = Integer.MAX_VALUE;
        for (Stock stock : stocks) {
            for (String name : namesOf(stock)) {
                String needle = normalize(name);
                if (needle.length() < 2) {
                    continue;
                }
                int position = indexOfCompanyName(text, needle);
                if (position < 0) {
                    continue;
                }
                // 긴 이름이 이긴다("삼성바이오로직스" > "삼성바이오"). 길이가 같으면 먼저 나온 쪽.
                if (needle.length() > bestLength || (needle.length() == bestLength && position < bestPosition)) {
                    best = stock;
                    bestLength = needle.length();
                    bestPosition = position;
                }
            }
        }
        return Optional.ofNullable(best);
    }

    private static List<String> namesOf(Stock stock) {
        List<String> aliases = ALIASES.getOrDefault(stock.getSymbol(), List.of());
        java.util.ArrayList<String> names = new java.util.ArrayList<>();
        if (stock.getName() != null) {
            names.add(stock.getName());
        }
        // 여섯 자리 종목 코드로 물어도 찾는다.
        if (stock.getSymbol() != null && stock.getSymbol().matches("\\d{6}")) {
            names.add(stock.getSymbol());
        }
        names.addAll(aliases);
        return names;
    }

    private static int indexOfCompanyName(String text, String needle) {
        int from = 0;
        while (true) {
            int position = text.indexOf(needle, from);
            if (position < 0) {
                return -1;
            }
            String rest = text.substring(position + needle.length());
            boolean otherCompany = OTHER_COMPANY_SUFFIXES.stream().anyMatch(rest::startsWith);
            if (!otherCompany) {
                return position;
            }
            from = position + needle.length();
        }
    }

    /** 띄어쓰기와 대소문자를 무시한다. "sk 하이닉스", "SK하이닉스"가 같다. */
    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }
}
