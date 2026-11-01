package com.stockflow.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 지금 요청을 보낸 회원이 누구인지.
 *
 * <p>JWT 에서 꺼낸 회원 번호를 돌려준다. 인증이 없으면 {@code stockflow.mock-member-id} 가 있을 때만 그 회원으로 보고,
 * 없으면(운영 기본) 401 로 끝낸다. 예전에는 무조건 1번 회원으로 떨어졌는데, 한 사람만 쓰던 시절의 흔적이라 기본값에서 뺐다.
 */
@Component
public class CurrentMemberProvider {

    private final Long fallbackMemberId;

    public CurrentMemberProvider(@Value("${stockflow.mock-member-id:#{null}}") Long fallbackMemberId) {
        this.fallbackMemberId = fallbackMemberId;
    }

    public Long currentMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long memberId) {
            return memberId;
        }
        if (fallbackMemberId != null) {
            return fallbackMemberId;
        }
        throw new AuthenticationCredentialsNotFoundException("로그인이 필요합니다.");
    }

    /** 운영 안전장치가 확인할 때 쓴다. */
    public boolean hasFallbackMember() {
        return fallbackMemberId != null;
    }
}
