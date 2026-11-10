package com.stockflow.auth.dto;

/**
 * 로그인 화면이 그리기 전에 알아야 하는 것.
 *
 * @param googleClientId 구글 버튼에 넣을 클라이언트 ID. 비밀이 아니다. null 이면 구글 로그인이 꺼져 있고 화면은 버튼을 그리지 않는다.
 */
public record AuthConfigResponse(String googleClientId) {
}
