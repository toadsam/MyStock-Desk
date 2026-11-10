package com.stockflow.auth.google;

/** 화면이 구글에서 받아 온 ID 토큰이 진짜인지 확인하고 내용을 꺼낸다. 테스트에서는 가짜로 바꿔 끼운다. */
public interface GoogleIdTokenVerifier {

    /** 클라이언트 ID 가 설정돼 있는지. 없으면 구글 로그인 자체가 꺼져 있다. */
    boolean isEnabled();

    /** 화면에 내려 줄 클라이언트 ID. 비밀이 아니다. 꺼져 있으면 null. */
    String clientId();

    /**
     * @throws IllegalArgumentException 서명이 틀렸거나, 우리 앱 앞으로 발급된 토큰이 아니거나, 만료된 경우
     */
    GoogleIdentity verify(String idToken);
}
