package com.stockflow.auth.google;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** 받아도 되는 토큰은 하나뿐이고, 나머지는 전부 같은 한 문장으로 거절된다. */
class JwksGoogleIdTokenVerifierTest {

    private final GoogleTokenFactory google = new GoogleTokenFactory();
    private final JwksGoogleIdTokenVerifier verifier = verifier(GoogleTokenFactory.CLIENT_ID);

    @Test
    void acceptsATokenGoogleSignedForThisApp() {
        GoogleIdentity identity = verifier.verify(google.token(google.claims("sub-1", "user@gmail.com")));

        assertEquals("sub-1", identity.subject());
        assertEquals("user@gmail.com", identity.email());
        assertTrue(identity.emailVerified());
        assertEquals("구글 사용자", identity.name());
    }

    @Test
    void readsEmailVerifiedWhetherItComesAsBooleanOrText() {
        Map<String, Object> claims = google.claims("sub-1", "user@gmail.com");
        claims.put("email_verified", "true");
        assertTrue(verifier.verify(google.token(claims)).emailVerified());

        claims.put("email_verified", false);
        assertFalse(verifier.verify(google.token(claims)).emailVerified());
    }

    @Test
    void rejectsATokenIssuedForAnotherApp() {
        Map<String, Object> claims = google.claims("sub-1", "user@gmail.com");
        claims.put("aud", "someone-else.apps.googleusercontent.com");
        assertRejected(google.token(claims));

        // 대상이 여럿이면 우리만을 위한 토큰이 아니다.
        claims.put("aud", List.of(GoogleTokenFactory.CLIENT_ID, "someone-else.apps.googleusercontent.com"));
        assertRejected(google.token(claims));
    }

    @Test
    void rejectsATokenNotIssuedByGoogle() {
        Map<String, Object> claims = google.claims("sub-1", "user@gmail.com");
        claims.put("iss", "https://accounts.evil.example");
        assertRejected(google.token(claims));
    }

    @Test
    void rejectsAnExpiredToken() {
        Map<String, Object> claims = google.claims("sub-1", "user@gmail.com");
        claims.put("exp", Instant.now().minusSeconds(600).getEpochSecond());
        assertRejected(google.token(claims));
    }

    @Test
    void rejectsContentsSwappedAfterSigning() {
        String genuine = google.token(google.claims("sub-1", "user@gmail.com"));
        assertRejected(google.withSwappedClaims(genuine, google.claims("sub-1", "victim@gmail.com")));
    }

    @Test
    void rejectsATokenSignedWithAnotherKey() {
        GoogleTokenFactory impostor = new GoogleTokenFactory();
        assertRejected(impostor.token(impostor.claims("sub-1", "victim@gmail.com")));
    }

    @Test
    void doesNotLetTheTokenChooseItsAlgorithmOrKey() {
        Map<String, Object> claims = google.claims("sub-1", "user@gmail.com");
        assertRejected(google.token(Map.of("alg", "none", "kid", GoogleTokenFactory.KEY_ID), claims));
        assertRejected(google.token(Map.of("alg", "HS256", "kid", GoogleTokenFactory.KEY_ID), claims));
        assertRejected(google.token(Map.of("alg", "RS256", "kid", "unknown-key"), claims));
    }

    @Test
    void rejectsGarbage() {
        assertRejected("not-a-token");
        assertRejected("a.b.c");
        assertRejected(null);
    }

    @Test
    void isOffWithoutAClientId() {
        JwksGoogleIdTokenVerifier off = verifier("  ");
        assertFalse(off.isEnabled());
        assertNull(off.clientId());
        assertThrows(IllegalArgumentException.class, () -> off.verify(google.token(google.claims("sub-1", "user@gmail.com"))));
    }

    private void assertRejected(String token) {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> verifier.verify(token));
        // 어디가 틀렸는지는 밖으로 나가지 않는다.
        assertEquals("구글 로그인 정보를 확인하지 못했어요. 다시 시도해 주세요.", exception.getMessage());
    }

    private JwksGoogleIdTokenVerifier verifier(String clientId) {
        return new JwksGoogleIdTokenVerifier(google.keySource(), new ObjectMapper(), Clock.systemUTC(), clientId);
    }
}
