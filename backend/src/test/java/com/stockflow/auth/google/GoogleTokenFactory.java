package com.stockflow.auth.google;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 테스트용 "구글". 키를 하나 만들어 그 키로 ID 토큰에 서명한다.
 * 진짜 검증 코드가 서명, 발급자, 대상, 만료를 실제로 따지게 하려고 가짜 응답 대신 진짜 서명을 쓴다.
 */
public final class GoogleTokenFactory {

    public static final String CLIENT_ID = "test-client-id.apps.googleusercontent.com";
    public static final String KEY_ID = "test-key-1";

    private static final Base64.Encoder URL = Base64.getUrlEncoder().withoutPadding();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final KeyPair keyPair;

    public GoogleTokenFactory() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            this.keyPair = generator.generateKeyPair();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    /** 이 공장의 키 하나만 아는 키 저장소. */
    public GoogleKeySource keySource() {
        return keyId -> KEY_ID.equals(keyId) ? keyPair.getPublic() : null;
    }

    /** 우리 앱 앞으로 발급되고, 이메일이 확인됐고, 한 시간 뒤 만료되는 평범한 토큰의 내용. 테스트가 필요한 칸만 바꾼다. */
    public Map<String, Object> claims(String subject, String email) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("iss", "https://accounts.google.com");
        claims.put("aud", CLIENT_ID);
        claims.put("sub", subject);
        claims.put("email", email);
        claims.put("email_verified", true);
        claims.put("name", "구글 사용자");
        claims.put("picture", "https://lh3.googleusercontent.com/a/test-picture");
        claims.put("iat", Instant.now().getEpochSecond());
        claims.put("exp", Instant.now().plusSeconds(3600).getEpochSecond());
        return claims;
    }

    public String token(Map<String, Object> claims) {
        return token(Map.of("alg", "RS256", "kid", KEY_ID, "typ", "JWT"), claims);
    }

    public String token(Map<String, Object> header, Map<String, Object> claims) {
        try {
            String signingInput = encode(header) + "." + encode(claims);
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(keyPair.getPrivate());
            signature.update(signingInput.getBytes(StandardCharsets.US_ASCII));
            return signingInput + "." + URL.encodeToString(signature.sign());
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    /** 서명은 그대로 두고 내용만 바꿔치기한 토큰. */
    public String withSwappedClaims(String token, Map<String, Object> otherClaims) {
        String[] parts = token.split("\\.");
        return parts[0] + "." + encode(otherClaims) + "." + parts[2];
    }

    private String encode(Map<String, Object> value) {
        try {
            return URL.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
