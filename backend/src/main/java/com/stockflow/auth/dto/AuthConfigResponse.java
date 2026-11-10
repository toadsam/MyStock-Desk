package com.stockflow.auth.dto;

/**
 * 로그인 화면이 그리기 전에 알아야 하는 것.
 *
 * @param googleClientId 구글 버튼에 넣을 클라이언트 ID. 비밀이 아니다. null 이면 구글 로그인이 꺼져 있고 화면은 버튼을 그리지 않는다.
 * @param passwordLoginEnabled false 면 이메일·비밀번호 가입과 로그인을 받지 않는다. 화면은 그 칸과 데모 버튼을 그리지 않는다.
 */
public record AuthConfigResponse(String googleClientId, boolean passwordLoginEnabled) {
}
