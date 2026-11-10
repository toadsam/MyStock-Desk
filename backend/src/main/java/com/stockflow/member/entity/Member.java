package com.stockflow.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String profileImageUrl;
    private String membershipGrade;
    private LocalDateTime createdAt;

    /** 이 시각(초)보다 먼저 발급된 토큰은 받지 않는다. 비밀번호를 바꿀 때 지금으로 당긴다. 비어 있으면 제한이 없다. */
    private Long tokensValidFrom;

    public void updateMembershipGrade(String membershipGrade) {
        this.membershipGrade = membershipGrade;
    }

    public void updateProfile(String name, String email, String profileImageUrl) {
        this.name = name;
        this.email = email;
        this.profileImageUrl = profileImageUrl;
    }

    public void updatePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void invalidateTokensIssuedBefore(long epochSecond) {
        this.tokensValidFrom = epochSecond;
    }
}
