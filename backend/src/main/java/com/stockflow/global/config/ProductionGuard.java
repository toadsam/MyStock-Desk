package com.stockflow.global.config;

import com.stockflow.auth.security.CurrentMemberProvider;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * 운영 프로파일(prod)에서 개발용 설정이 남아 있으면 부팅을 거부한다.
 *
 * <p>환경변수를 빠뜨린 건 application-prod.yml 이 기본값 없이 요구해서 이미 막힌다. 여기서는 "값은 있는데 위험한" 경우를 본다.
 * 개발용 JWT 시크릿을 그대로 복사했거나, 너무 짧거나, H2 콘솔이나 mock-member 가 어쩌다 켜진 경우다.
 * 한 번 뜨고 나면 아무도 설정을 다시 보지 않으니, 뜨기 전에 한 번에 다 말해 준다.
 */
@Component
@Profile("prod")
public class ProductionGuard {

    /** HS256 키는 최소 256비트. 그보다 짧으면 토큰을 찍어 내기 쉬워진다. */
    static final int MIN_SECRET_BYTES = 32;

    private final String jwtSecret;
    private final boolean h2ConsoleEnabled;
    private final boolean showSql;
    private final CurrentMemberProvider currentMemberProvider;

    public ProductionGuard(
            @Value("${stockflow.jwt.secret}") String jwtSecret,
            @Value("${spring.h2.console.enabled:false}") boolean h2ConsoleEnabled,
            @Value("${spring.jpa.show-sql:false}") boolean showSql,
            CurrentMemberProvider currentMemberProvider
    ) {
        this.jwtSecret = jwtSecret;
        this.h2ConsoleEnabled = h2ConsoleEnabled;
        this.showSql = showSql;
        this.currentMemberProvider = currentMemberProvider;
    }

    @PostConstruct
    void verify() {
        List<String> problems = new ArrayList<>();
        String secret = jwtSecret == null ? "" : jwtSecret.trim();
        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            problems.add("STOCKFLOW_JWT_SECRET 이 " + MIN_SECRET_BYTES + "바이트보다 짧습니다. 예: openssl rand -base64 48");
        }
        String lower = secret.toLowerCase();
        if (lower.contains("development") || lower.contains("change-before") || lower.contains("change_this") || lower.startsWith("stockflow-local")) {
            problems.add("STOCKFLOW_JWT_SECRET 이 개발용 기본값입니다. 새로 만든 값으로 바꾸세요.");
        }
        if (h2ConsoleEnabled) {
            problems.add("spring.h2.console.enabled 가 켜져 있습니다. 운영에서는 끕니다.");
        }
        if (currentMemberProvider.hasFallbackMember()) {
            problems.add("STOCKFLOW_MOCK_MEMBER_ID 가 설정되어 있습니다. 로그인 없는 요청이 그 회원으로 처리되니 운영에서는 비웁니다.");
        }
        if (showSql) {
            problems.add("spring.jpa.show-sql 이 켜져 있습니다. 로그에 모든 SQL 이 남으니 운영에서는 끕니다.");
        }
        if (!problems.isEmpty()) {
            throw new IllegalStateException("운영 설정이 안전하지 않아 서버를 띄우지 않습니다.\n - " + String.join("\n - ", problems));
        }
    }
}
