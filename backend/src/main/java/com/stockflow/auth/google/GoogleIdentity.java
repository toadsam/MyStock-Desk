package com.stockflow.auth.google;

/**
 * 구글이 서명해 준 "이 사람이 누구인지".
 *
 * @param subject       구글 계정의 고유 번호(sub). 이메일은 바뀔 수 있어도 이 값은 안 바뀌므로 이걸로 회원을 찾는다.
 * @param emailVerified 구글이 그 이메일의 주인임을 확인했는지.
 */
public record GoogleIdentity(String subject, String email, boolean emailVerified, String name, String pictureUrl) {
}
