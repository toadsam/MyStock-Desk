package com.stockflow.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentMemberProvider {

    private final Long fallbackMemberId;

    public CurrentMemberProvider(@Value("${stockflow.mock-member-id:1}") Long fallbackMemberId) {
        this.fallbackMemberId = fallbackMemberId;
    }

    public Long currentMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long memberId) {
            return memberId;
        }
        return fallbackMemberId;
    }
}
