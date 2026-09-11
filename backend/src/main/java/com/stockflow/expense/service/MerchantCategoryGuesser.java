package com.stockflow.expense.service;

import com.stockflow.expense.entity.Expense;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * 가게 이름으로 카테고리를 추측한다.
 *
 * <p>사용자의 과거 기록이 사전보다 항상 우선한다. 한 번 카테고리를 고쳐 두면
 * 그 가게는 다음부터 고친 값으로 분류되므로, 쓸수록 정확해진다.
 */
@Component
public class MerchantCategoryGuesser {

    static final String DEFAULT_CATEGORY = "기타";

    private static final Map<String, List<String>> KEYWORDS = new LinkedHashMap<>();

    static {
        KEYWORDS.put("카페", List.of(
                "스타벅스", "STARBUCKS", "메가커피", "메가엠지씨", "이디야", "투썸", "컴포즈", "빽다방",
                "할리스", "폴바셋", "블루보틀", "탐앤탐스", "파스쿠찌", "공차", "커피", "카페", "COFFEE"));
        KEYWORDS.put("배달비", List.of(
                "배달의민족", "배민", "요기요", "쿠팡이츠", "배달"));
        KEYWORDS.put("구독", List.of(
                "넷플릭스", "NETFLIX", "유튜브", "YOUTUBE", "스포티파이", "SPOTIFY", "왓챠", "티빙", "TVING",
                "웨이브", "디즈니", "DISNEY", "쿠팡플레이", "멜론", "지니뮤직", "밀리의서재", "리디",
                "APPLE.COM", "GOOGLE", "OPENAI", "CHATGPT", "구독"));
        KEYWORDS.put("교통", List.of(
                "지하철", "도시철도", "버스", "택시", "카카오T", "카카오택시", "티머니", "코레일", "SRT",
                "고속버스", "주유", "칼텍스", "SK에너지", "S-OIL", "현대오일", "하이패스", "주차"));
        KEYWORDS.put("식비", List.of(
                "김밥", "분식", "식당", "국밥", "백반", "맥도날드", "버거킹", "롯데리아", "맘스터치",
                "서브웨이", "한솥", "본죽", "치킨", "BBQ", "교촌", "BHC", "피자", "마라", "돈까스",
                "이마트", "홈플러스", "롯데마트", "노브랜드", "마트", "GS25", "CU ", "세븐일레븐",
                "이마트24", "편의점"));
        KEYWORDS.put("쇼핑", List.of(
                "쿠팡", "COUPANG", "11번가", "G마켓", "지마켓", "옥션", "무신사", "지그재그", "에이블리",
                "올리브영", "다이소", "AMAZON", "아마존", "SSG", "위메프", "티몬", "네이버페이"));
    }

    /**
     * @param merchant 가게 이름
     * @param history  이 회원의 과거 소비 기록. 같은 가게가 있으면 그 최빈 카테고리를 쓴다.
     */
    public String guess(String merchant, List<Expense> history) {
        if (merchant == null || merchant.isBlank()) {
            return DEFAULT_CATEGORY;
        }
        String fromHistory = fromHistory(merchant, history);
        if (fromHistory != null) {
            return fromHistory;
        }
        String upper = merchant.toUpperCase();
        for (Map.Entry<String, List<String>> entry : KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (upper.contains(keyword.toUpperCase().trim())) {
                    return entry.getKey();
                }
            }
        }
        return DEFAULT_CATEGORY;
    }

    private String fromHistory(String merchant, List<Expense> history) {
        if (history == null || history.isEmpty()) {
            return null;
        }
        String normalized = normalize(merchant);
        Map<String, Long> counts = history.stream()
                .filter(expense -> expense.getMerchant() != null)
                .filter(expense -> normalize(expense.getMerchant()).equals(normalized))
                .collect(Collectors.groupingBy(Expense::getCategory, Collectors.counting()));
        return counts.entrySet().stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    static String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toUpperCase();
    }
}
