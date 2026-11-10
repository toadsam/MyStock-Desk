package com.stockflow.member.dto;

import com.stockflow.member.entity.Member;
import java.time.LocalDateTime;

public record MemberDto(
        Long id,
        String name,
        String email,
        String profileImageUrl,
        String membershipGrade,
        /** GOOGLE 이면 비밀번호가 없는 계정이다. 화면이 비밀번호 변경 칸을 숨긴다. */
        String loginProvider,
        LocalDateTime createdAt
) {
    public static MemberDto from(Member member) {
        return new MemberDto(
                member.getId(),
                member.getName(),
                member.getEmail(),
                member.getProfileImageUrl(),
                member.getMembershipGrade(),
                member.usesGoogleLogin() ? "GOOGLE" : "PASSWORD",
                member.getCreatedAt()
        );
    }
}
