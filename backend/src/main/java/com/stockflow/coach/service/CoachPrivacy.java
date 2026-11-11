package com.stockflow.coach.service;

import java.util.regex.Pattern;

/**
 * 바깥 모델로 나가는 글에서 개인을 알아볼 수 있는 것을 가린다.
 *
 * <p>가계부 숫자 쪽은 처음부터 이름이나 가게를 넣지 않는다({@code MyNumbersRetriever}).
 * 여기서 다루는 것은 사용자가 질문에 직접 적은 글자다. 무엇을 적을지는 막을 수 없으니,
 * 흔한 꼴(이메일, 전화번호, 계좌나 카드처럼 긴 숫자)만이라도 보내기 전에 가린다.
 */
public final class CoachPrivacy {

    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    /** 010-1234-5678, 010 1234 5678, 01012345678, 02-123-4567 */
    private static final Pattern PHONE = Pattern.compile("(?<!\\d)0\\d{1,2}[-\\s.]?\\d{3,4}[-\\s.]?\\d{4}(?!\\d)");
    /** 주민번호, 계좌, 카드처럼 숫자가 길게 이어지는 것. 사이에 낀 하이픈과 공백도 한 덩어리로 본다. */
    private static final Pattern LONG_NUMBER = Pattern.compile("(?<![\\d,])\\d(?:[-\\s]?\\d){8,}(?![\\d,])");

    private CoachPrivacy() {
    }

    public static String redact(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String result = EMAIL.matcher(text).replaceAll("[이메일 가림]");
        result = PHONE.matcher(result).replaceAll("[전화번호 가림]");
        result = LONG_NUMBER.matcher(result).replaceAll("[번호 가림]");
        return result;
    }
}
