package com.stockflow.coach.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CoachPrivacyTest {

    @Test
    @DisplayName("이메일, 전화번호, 긴 숫자를 가린다")
    void redactsIdentifiers() {
        String redacted = CoachPrivacy.redact(
                "제 메일은 someone@example.com 이고 번호는 010-1234-5678, 계좌는 110-123-456789 예요. 주민번호 900101-1234567");

        assertThat(redacted)
                .doesNotContain("someone@example.com")
                .doesNotContain("010-1234-5678")
                .doesNotContain("110-123-456789")
                .doesNotContain("900101-1234567")
                .contains("[이메일 가림]")
                .contains("[전화번호 가림]")
                .contains("[번호 가림]");
    }

    @Test
    @DisplayName("금액과 날짜처럼 평범한 숫자는 그대로 둔다")
    void keepsOrdinaryNumbers() {
        String text = "이번 달에 1,250,000원 썼는데 2026년 11월 11일 기준으로 30000원짜리를 사도 될까?";
        assertThat(CoachPrivacy.redact(text)).isEqualTo(text);
    }

    @Test
    @DisplayName("빈 글은 빈 글로 돌려준다")
    void handlesBlank() {
        assertThat(CoachPrivacy.redact(null)).isEmpty();
        assertThat(CoachPrivacy.redact("  ")).isEmpty();
    }
}
