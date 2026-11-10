package com.stockflow.auth.google;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.global.exception.ExternalDataException;
import java.nio.charset.StandardCharsets;
import java.security.PublicKey;
import java.security.Signature;
import java.time.Clock;
import java.util.Base64;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 구글 ID 토큰을 서버에서 직접 검증한다.
 *
 * <p>화면이 보낸 이름과 이메일을 그대로 믿으면 누구든 남의 이메일로 로그인할 수 있다. 믿는 것은 구글의 서명뿐이다.
 * 확인하는 것은 넷이다: 구글 키로 서명됐는지, 발급자가 구글인지, <b>우리 앱 앞으로</b> 발급됐는지(aud), 만료되지 않았는지.
 * aud 를 안 보면 다른 사이트가 받은 토큰으로도 들어올 수 있다.
 */
@Component
public class JwksGoogleIdTokenVerifier implements GoogleIdTokenVerifier {

    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");
    /** 서버 시계와 구글 시계가 조금 어긋나도 받아 준다. */
    private static final long CLOCK_SKEW_SECONDS = 60;
    private static final String REJECTED = "구글 로그인 정보를 확인하지 못했어요. 다시 시도해 주세요.";

    private final GoogleKeySource keySource;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final String clientId;

    public JwksGoogleIdTokenVerifier(
            GoogleKeySource keySource,
            ObjectMapper objectMapper,
            Clock clock,
            @Value("${stockflow.auth.google.client-id:}") String clientId
    ) {
        this.keySource = keySource;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    @Override
    public boolean isEnabled() {
        return !clientId.isEmpty();
    }

    @Override
    public String clientId() {
        return isEnabled() ? clientId : null;
    }

    @Override
    public GoogleIdentity verify(String idToken) {
        if (!isEnabled()) {
            throw new IllegalArgumentException("구글 로그인이 아직 설정되지 않았어요.");
        }
        try {
            String[] parts = idToken == null ? new String[0] : idToken.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("세 부분으로 된 토큰이 아니다");
            }
            Map<String, Object> header = decode(parts[0]);
            // 알고리즘을 토큰이 정하게 두지 않는다. none 이나 HS256 으로 바꿔 보내는 공격을 여기서 끊는다.
            if (!"RS256".equals(header.get("alg")) || !(header.get("kid") instanceof String keyId)) {
                throw new IllegalArgumentException("알고리즘이나 키 번호가 다르다");
            }
            PublicKey key = keySource.find(keyId);
            if (key == null) {
                throw new IllegalArgumentException("모르는 키 번호다");
            }
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(key);
            signature.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
            if (!signature.verify(Base64.getUrlDecoder().decode(parts[2]))) {
                throw new IllegalArgumentException("서명이 맞지 않는다");
            }

            Map<String, Object> claims = decode(parts[1]);
            if (!ISSUERS.contains(String.valueOf(claims.get("iss")))) {
                throw new IllegalArgumentException("발급자가 구글이 아니다");
            }
            if (!audienceMatches(claims.get("aud"))) {
                throw new IllegalArgumentException("우리 앱 앞으로 발급된 토큰이 아니다");
            }
            if (!(claims.get("exp") instanceof Number expiresAt)
                    || clock.instant().getEpochSecond() > expiresAt.longValue() + CLOCK_SKEW_SECONDS) {
                throw new IllegalArgumentException("만료됐다");
            }
            if (!(claims.get("sub") instanceof String subject) || subject.isBlank()
                    || !(claims.get("email") instanceof String email) || email.isBlank()) {
                throw new IllegalArgumentException("계정 번호나 이메일이 없다");
            }
            Object verified = claims.get("email_verified");
            return new GoogleIdentity(
                    subject,
                    email,
                    Boolean.TRUE.equals(verified) || "true".equals(verified),
                    claims.get("name") instanceof String name ? name : null,
                    claims.get("picture") instanceof String picture ? picture : null
            );
        } catch (ExternalDataException exception) {
            throw exception;
        } catch (Exception exception) {
            // 왜 틀렸는지는 밖으로 알리지 않는다. 화면에는 한 문장만 나간다.
            throw new IllegalArgumentException(REJECTED, exception);
        }
    }

    private boolean audienceMatches(Object audience) {
        if (audience instanceof String single) {
            return clientId.equals(single);
        }
        return audience instanceof Collection<?> many && many.size() == 1 && many.contains(clientId);
    }

    private Map<String, Object> decode(String part) throws Exception {
        return objectMapper.readValue(Base64.getUrlDecoder().decode(part), new TypeReference<>() {
        });
    }
}
