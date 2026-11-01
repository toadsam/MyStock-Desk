package com.stockflow.auth.security;

import com.stockflow.global.exception.TooManyRequestsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 비밀번호를 연달아 틀리면 잠시 막는다.
 *
 * <p>열쇠는 "요청한 주소 + 이메일"이다. 한 이메일을 여러 주소에서 두드리는 것도, 한 주소에서 여러 이메일을 두드리는 것도
 * 각 열쇠마다 {@code max-failures}번까지만 허용한다. 넘으면 마지막 실패로부터 {@code lock-minutes} 동안은 맞는 비밀번호도 429 다.
 * 성공하면 그 열쇠의 기록을 지운다.
 *
 * <p>메모리에만 둔다. 서버가 한 대이고 재시작하면 풀리는데, 그 정도면 무차별 대입을 느리게 만드는 목적에는 충분하다.
 * 서버를 여러 대로 늘리면 Redis 같은 공용 저장소로 옮겨야 한다.
 */
@Component
public class LoginAttemptLimiter {

    private static final int PRUNE_THRESHOLD = 10_000;

    private final Clock clock;
    private final int maxFailures;
    private final Duration lockDuration;
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public LoginAttemptLimiter(
            Clock clock,
            @Value("${stockflow.auth.login.max-failures:5}") int maxFailures,
            @Value("${stockflow.auth.login.lock-minutes:10}") long lockMinutes
    ) {
        this.clock = clock;
        this.maxFailures = maxFailures;
        this.lockDuration = Duration.ofMinutes(lockMinutes);
    }

    /** 로그인 전에 부른다. 잠겨 있으면 429 예외. */
    public void checkAllowed(String clientIp, String email) {
        Attempt attempt = attempts.get(key(clientIp, email));
        if (attempt != null && attempt.failures >= maxFailures && !expired(attempt)) {
            long minutesLeft = Math.max(1, Duration.between(now(), attempt.lastFailure.plus(lockDuration)).toMinutes() + 1);
            throw new TooManyRequestsException("비밀번호를 " + maxFailures + "번 틀려서 잠시 막았어요. " + minutesLeft + "분 뒤에 다시 시도해 주세요.");
        }
    }

    public void recordFailure(String clientIp, String email) {
        if (attempts.size() > PRUNE_THRESHOLD) {
            attempts.entrySet().removeIf(entry -> expired(entry.getValue()));
        }
        attempts.compute(key(clientIp, email), (ignored, previous) -> {
            int failures = previous == null || expired(previous) ? 1 : previous.failures + 1;
            return new Attempt(failures, now());
        });
    }

    public void recordSuccess(String clientIp, String email) {
        attempts.remove(key(clientIp, email));
    }

    private boolean expired(Attempt attempt) {
        return attempt.lastFailure.plus(lockDuration).isBefore(now());
    }

    private Instant now() {
        return Instant.now(clock);
    }

    private String key(String clientIp, String email) {
        String ip = clientIp == null ? "?" : clientIp;
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return ip + "|" + normalizedEmail;
    }

    private record Attempt(int failures, Instant lastFailure) {
    }
}
