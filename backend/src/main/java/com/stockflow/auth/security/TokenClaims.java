package com.stockflow.auth.security;

/**
 * 서명과 만료를 확인한 토큰에서 꺼낸 값.
 *
 * @param tokenId   토큰마다 다른 번호(jti). 로그아웃한 토큰을 이걸로 기억한다.
 * @param issuedAt  발급 시각(초). 비밀번호를 바꾸면 그 전에 발급된 토큰을 이걸로 걸러 낸다.
 * @param expiresAt 만료 시각(초). 폐기 기록을 언제 지워도 되는지 알려 준다.
 */
public record TokenClaims(Long memberId, String tokenId, long issuedAt, long expiresAt) {
}
