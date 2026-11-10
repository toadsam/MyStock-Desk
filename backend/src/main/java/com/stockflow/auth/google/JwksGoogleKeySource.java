package com.stockflow.auth.google;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.global.exception.ExternalDataException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * 구글의 공개키 목록(JWKS)을 받아 와 들고 있는다.
 *
 * <p>구글은 키를 주기적으로 바꾸고, 응답의 Cache-Control 로 언제까지 믿어도 되는지 알려 준다. 그때까지는 다시 받지 않는다.
 * 모르는 키 번호가 오면 방금 바뀐 것일 수 있으니 한 번 더 받아 보되, 엉터리 토큰으로 구글을 계속 두드리지 않게 1분에 한 번으로 묶는다.
 */
@Component
public class JwksGoogleKeySource implements GoogleKeySource {

    private static final URI CERTS_URI = URI.create("https://www.googleapis.com/oauth2/v3/certs");
    private static final Pattern MAX_AGE = Pattern.compile("max-age=(\\d+)");
    private static final Duration DEFAULT_LIFETIME = Duration.ofHours(1);
    private static final Duration MIN_REFETCH_GAP = Duration.ofMinutes(1);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private Map<String, PublicKey> keys = Map.of();
    private Instant expiresAt = Instant.EPOCH;
    private Instant fetchedAt = Instant.EPOCH;

    public JwksGoogleKeySource(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public synchronized PublicKey find(String keyId) {
        Instant now = Instant.now();
        boolean stale = now.isAfter(expiresAt);
        boolean unknownButWorthAsking = !keys.containsKey(keyId) && now.isAfter(fetchedAt.plus(MIN_REFETCH_GAP));
        if (stale || unknownButWorthAsking) {
            refresh(now);
        }
        return keys.get(keyId);
    }

    private void refresh(Instant now) {
        try {
            HttpRequest request = HttpRequest.newBuilder(CERTS_URI).timeout(Duration.ofSeconds(5)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("status " + response.statusCode());
            }
            Map<String, PublicKey> parsed = new HashMap<>();
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            for (JsonNode key : objectMapper.readTree(response.body()).path("keys")) {
                if (!"RSA".equals(key.path("kty").asText())) {
                    continue;
                }
                BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(key.path("n").asText()));
                BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(key.path("e").asText()));
                parsed.put(key.path("kid").asText(), keyFactory.generatePublic(new RSAPublicKeySpec(modulus, exponent)));
            }
            if (parsed.isEmpty()) {
                throw new IllegalStateException("no keys");
            }
            keys = Map.copyOf(parsed);
            fetchedAt = now;
            expiresAt = now.plus(lifetime(response.headers().firstValue("Cache-Control").orElse("")));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ExternalDataException("GOOGLE_UNAVAILABLE", "구글에 잠시 연결하지 못했어요. 조금 뒤에 다시 시도해 주세요.", exception);
        } catch (Exception exception) {
            // 예전에 받아 둔 키가 있으면 그걸로 버틴다. 구글이 잠깐 안 닿는다고 로그인을 전부 막을 이유는 없다.
            fetchedAt = now;
            if (keys.isEmpty()) {
                throw new ExternalDataException("GOOGLE_UNAVAILABLE", "구글에 잠시 연결하지 못했어요. 조금 뒤에 다시 시도해 주세요.", exception);
            }
        }
    }

    private Duration lifetime(String cacheControl) {
        Matcher matcher = MAX_AGE.matcher(cacheControl);
        return matcher.find() ? Duration.ofSeconds(Long.parseLong(matcher.group(1))) : DEFAULT_LIFETIME;
    }
}
