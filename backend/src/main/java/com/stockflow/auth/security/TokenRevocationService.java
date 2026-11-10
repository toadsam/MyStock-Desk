package com.stockflow.auth.security;

import com.stockflow.auth.entity.RevokedToken;
import com.stockflow.auth.repository.RevokedTokenRepository;
import com.stockflow.member.repository.MemberRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 서명이 맞아도 더는 받지 않는 토큰을 가려낸다.
 *
 * <p>두 가지다. 로그아웃한 토큰은 그 한 장만 버린다(데모 계정처럼 여럿이 같이 쓰는 계정에서 한 사람의 로그아웃이
 * 나머지를 내보내면 안 된다). 비밀번호를 바꾸면 그 계정으로 그 전에 발급된 토큰을 모두 버린다.
 */
@Service
@RequiredArgsConstructor
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public boolean isRevoked(TokenClaims claims) {
        if (revokedTokenRepository.existsById(claims.tokenId())) {
            return true;
        }
        // 회원이 없어졌으면 그 토큰도 끝이다.
        return memberRepository.findById(claims.memberId())
                .map(member -> member.getTokensValidFrom() != null && claims.issuedAt() < member.getTokensValidFrom())
                .orElse(true);
    }

    @Transactional
    public void revoke(TokenClaims claims) {
        revokedTokenRepository.deleteByExpiresAtLessThan(Instant.now().getEpochSecond());
        if (!revokedTokenRepository.existsById(claims.tokenId())) {
            revokedTokenRepository.save(new RevokedToken(claims.tokenId(), claims.expiresAt()));
        }
    }
}
