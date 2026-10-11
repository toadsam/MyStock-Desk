package com.stockflow.global.format;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * 사람이 읽는 문장에 숫자를 넣을 때 쓰는 표기.
 *
 * <p>BigDecimal 을 그대로 이어 붙이면 "120883000.00원"처럼 찍힌다. 문장 안의 금액과 비율은
 * 전부 여기를 거친다. 화면의 won() 과 같은 모양(천 단위 쉼표, 원 단위 반올림)이다.
 */
public final class Formats {

    private Formats() {
    }

    /** 12,000원 */
    public static String won(BigDecimal value) {
        BigDecimal rounded = (value == null ? BigDecimal.ZERO : value).setScale(0, RoundingMode.HALF_UP);
        return NumberFormat.getIntegerInstance(Locale.KOREA).format(rounded) + "원";
    }

    /** 37.3% — 소수점 아래가 0 이면 떼어 낸다. */
    public static String rate(BigDecimal value) {
        BigDecimal scaled = (value == null ? BigDecimal.ZERO : value).setScale(1, RoundingMode.HALF_UP).stripTrailingZeros();
        return scaled.toPlainString() + "%";
    }
}
