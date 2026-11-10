package com.stockflow.member.service;

import com.stockflow.global.exception.ForbiddenException;
import com.stockflow.member.entity.Member;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 로그인 화면의 "데모 계정으로 로그인"이 쓰는 계정을 지킨다.
 *
 * <p>누구나 들어오는 계정이라, 한 사람이 비밀번호나 이메일을 바꾸면 그 뒤로 데모 로그인이 전부 막힌다.
 * 이름과 사진도 모두에게 보이므로 함께 잠근다. 지출이나 목표 같은 기록은 써 보라고 둔 것이라 막지 않는다.
 */
@Component
public class DemoAccountPolicy {

    private final String demoEmail;

    public DemoAccountPolicy(@Value("${stockflow.demo.email:investor@stockflow.com}") String demoEmail) {
        this.demoEmail = demoEmail == null ? "" : demoEmail.trim();
    }

    public boolean isDemo(Member member) {
        return !demoEmail.isEmpty() && demoEmail.equalsIgnoreCase(member.getEmail());
    }

    public void requireEditable(Member member) {
        if (isDemo(member)) {
            throw new ForbiddenException("데모 계정의 프로필과 비밀번호는 바꿀 수 없어요. 새 계정을 만들면 자유롭게 바꿀 수 있어요.");
        }
    }
}
