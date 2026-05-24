package com.stockflow.member.dto;

import com.stockflow.member.entity.Member;
import java.time.LocalDateTime;

public record MemberDto(
        Long id,
        String name,
        String email,
        String profileImageUrl,
        String membershipGrade,
        LocalDateTime createdAt
) {
    public static MemberDto from(Member member) {
        return new MemberDto(
                member.getId(),
                member.getName(),
                member.getEmail(),
                member.getProfileImageUrl(),
                member.getMembershipGrade(),
                member.getCreatedAt()
        );
    }
}
