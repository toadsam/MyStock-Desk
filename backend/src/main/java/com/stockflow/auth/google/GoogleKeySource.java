package com.stockflow.auth.google;

import java.security.PublicKey;

/** 구글이 ID 토큰에 서명할 때 쓰는 공개키를 키 번호(kid)로 찾아 준다. */
public interface GoogleKeySource {

    /** 없는 번호면 null. */
    PublicKey find(String keyId);
}
