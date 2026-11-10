package com.stockflow.global.validation;

/**
 * 입력으로 받는 금액과 글자 수의 상한.
 *
 * <p>상한이 없으면 99조 원짜리 지출 한 건이 월 합계, 하루 예산, 달성률을 전부 망가뜨린다.
 * 실제로 쓸 일이 없는 크기에서 끊는다. 애너테이션 값으로 쓰려고 문자열 상수로 둔다.
 */
public final class Limits {

    /** 지출 한 건, 퀵버튼 금액: 1억 원. */
    public static final String EXPENSE_MAX = "100000000";

    /** 목표, 예산, 매매 단가: 100억 원. */
    public static final String PLAN_MAX = "10000000000";

    /** 계좌 잔액: 1조 원. 대출처럼 음수인 계좌도 있어서 아래로도 같은 폭을 둔다. */
    public static final String BALANCE_MAX = "1000000000000";
    public static final String BALANCE_MIN = "-1000000000000";

    private Limits() {
    }
}
