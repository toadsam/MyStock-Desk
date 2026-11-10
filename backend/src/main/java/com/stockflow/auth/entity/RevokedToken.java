package com.stockflow.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그아웃으로 버린 토큰.
 *
 * <p>JWT 는 서버가 기억하지 않는 표라서 로그아웃해도 만료 전까지는 그대로 통한다. 버린 토큰의 번호만 적어 두고
 * 요청마다 대조한다. 만료가 지난 줄은 더 볼 일이 없으니 새로 적을 때 함께 지운다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class RevokedToken {

    @Id
    @Column(length = 64)
    private String tokenId;

    /** 원래 토큰의 만료 시각(초). */
    @Column(nullable = false)
    private long expiresAt;
}
