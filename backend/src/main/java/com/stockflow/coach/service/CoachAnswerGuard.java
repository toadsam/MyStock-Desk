package com.stockflow.coach.service;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 모델이 쓴 답을 사용자에게 보내기 전에 검사한다.
 *
 * <p>지시문만으로는 약속이 되지 않는다. 모델은 가끔 숫자를 어림하거나 계산해서 만들고,
 * 투자 질문에 "사세요"라고 답하기도 한다. 그래서 두 가지를 코드로 확인한다.
 * <ul>
 *   <li>숫자: 답에 나온 세 자리 이상 숫자는 전부 자료나 질문에 있던 숫자여야 한다.</li>
 *   <li>투자 조언: 사라/팔라, 오를 것이다 같은 말이 있으면 안 된다.</li>
 * </ul>
 * 하나라도 걸리면 그 답은 버리고 정해진 답으로 돌아간다.
 */
public final class CoachAnswerGuard {

    /** 12,790 / 12790 / 37.3 같은 숫자 덩어리 */
    private static final Pattern NUMBER = Pattern.compile("\\d[\\d,]*(?:\\.\\d+)?");
    /** "1만 2천원", "3만원", "2억"처럼 한글 단위로 바꿔 쓴 금액. 자료는 이런 꼴을 쓰지 않으므로 모델이 어림한 것이다. */
    private static final Pattern KOREAN_UNIT_AMOUNT = Pattern.compile("\\d\\s*(?:천만|백만|십만|만|천|억)\\s*원?");
    private static final Pattern ADVICE = Pattern.compile(
            "(?:매수|매도)\\s*(?:하세요|하시|해\\s?보세요|를\\s*추천|를\\s*권|하는\\s*(?:게|것이)\\s*좋)"
                    + "|사세요|파세요|사\\s?두세요|담으세요"
                    + "|(?:사|파)는\\s*(?:게|것이|편이)\\s*(?:좋|낫)"
                    + "|추천\\s*종목|종목(?:을|은)?\\s*추천|추천(?:드리는|하는)\\s*(?:종목|상품|펀드|ETF)"
                    + "|(?:오를|떨어질|상승할|하락할|반등할)\\s*(?:것|거|전망|가능성|확률)"
                    + "|투자\\s*(?:하세요|해\\s?보세요|하시는\\s*(?:것을|걸)\\s*(?:추천|권)|하는\\s*(?:게|것이)\\s*좋|를\\s*(?:추천|권))"
                    + "|수익(?:이|을)\\s*(?:날|낼|보장)");

    private CoachAnswerGuard() {
    }

    /**
     * @param answer  모델이 쓴 답
     * @param sources 숫자가 나와도 되는 글(자료 전체와 사용자의 질문)
     * @return 답에 처음 나온 "근거 없는 숫자". 없으면 null.
     */
    public static String firstUnknownNumber(String answer, String sources) {
        if (answer == null) {
            return null;
        }
        String source = sources == null ? "" : sources;
        Matcher unit = KOREAN_UNIT_AMOUNT.matcher(answer);
        while (unit.find()) {
            // 사용자가 "3만원짜리"라고 물은 것을 되받아 쓰는 것은 괜찮다.
            if (!source.replaceAll("\\s", "").contains(unit.group().replaceAll("\\s", ""))) {
                return unit.group().trim();
            }
        }
        Set<String> known = numbersIn(source);
        Matcher matcher = NUMBER.matcher(answer);
        while (matcher.find()) {
            String value = normalize(matcher.group());
            if (digitCount(value) >= 3 && !known.contains(value)) {
                return matcher.group();
            }
        }
        return null;
    }

    public static boolean looksLikeInvestmentAdvice(String answer) {
        return answer != null && ADVICE.matcher(answer).find();
    }

    private static Set<String> numbersIn(String text) {
        Set<String> numbers = new HashSet<>();
        // "100% 달성"은 자료에 없어도 흔히 쓰는 말이고 금액이 아니다.
        numbers.add("100");
        Matcher matcher = NUMBER.matcher(text);
        while (matcher.find()) {
            numbers.add(normalize(matcher.group()));
        }
        return numbers;
    }

    /** 12,790 과 12790 을 같은 숫자로 본다. 37.30 과 37.3 도 같다. */
    private static String normalize(String raw) {
        String value = raw.replace(",", "");
        if (value.contains(".")) {
            value = value.replaceAll("0+$", "").replaceAll("\\.$", "");
        }
        return value;
    }

    private static int digitCount(String value) {
        int count = 0;
        for (int index = 0; index < value.length(); index++) {
            if (Character.isDigit(value.charAt(index))) {
                count++;
            }
        }
        return count;
    }
}
