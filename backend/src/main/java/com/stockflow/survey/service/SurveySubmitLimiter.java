package com.stockflow.survey.service;

import com.stockflow.global.exception.TooManyRequestsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 한 주소에서 설문을 연달아 보내는 것을 막는다.
 *
 * <p>설문은 로그인 없이 보낼 수 있어서, 막지 않으면 누군가 같은 답을 수천 번 넣어 결과를 망가뜨릴 수 있다.
 * 같은 주소는 한 시간에 {@code per-address-per-hour}번까지만 받는다. 학교나 회사처럼 여럿이 한 주소를 쓰는 곳도 있어서 1번으로 좁히지는 않는다.
 *
 * <p>주소는 여기 메모리에만 잠깐 있고 답과 함께 저장하지 않는다. 서버가 재시작하면 풀린다(LoginAttemptLimiter 와 같은 이유로 그 정도면 충분하다).
 */
@Component
public class SurveySubmitLimiter {

    private static final Duration WINDOW = Duration.ofHours(1);
    private static final int PRUNE_THRESHOLD = 10_000;

    private final Clock clock;
    private final int perAddressPerHour;
    private final Map<String, Deque<Instant>> recent = new ConcurrentHashMap<>();

    public SurveySubmitLimiter(Clock clock, @Value("${stockflow.survey.per-address-per-hour:5}") int perAddressPerHour) {
        this.clock = clock;
        this.perAddressPerHour = perAddressPerHour;
    }

    /** 받아도 되면 이번 한 번을 세고 돌아온다. 넘었으면 429 예외. */
    public void acquire(String clientAddress) {
        Instant now = Instant.now(clock);
        Instant cutoff = now.minus(WINDOW);
        if (recent.size() > PRUNE_THRESHOLD) {
            recent.entrySet().removeIf(entry -> entry.getValue().isEmpty() || entry.getValue().peekLast().isBefore(cutoff));
        }
        String key = clientAddress == null ? "?" : clientAddress;
        recent.compute(key, (ignored, previous) -> {
            Deque<Instant> times = previous == null ? new ArrayDeque<>() : previous;
            while (!times.isEmpty() && times.peekFirst().isBefore(cutoff)) {
                times.pollFirst();
            }
            if (times.size() >= perAddressPerHour) {
                throw new TooManyRequestsException("설문을 이미 여러 번 보내셨어요. 잠시 뒤에 다시 시도해 주세요.");
            }
            times.addLast(now);
            return times;
        });
    }
}
