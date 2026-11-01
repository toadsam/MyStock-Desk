package com.stockflow.global.health;

import com.stockflow.global.response.ApiResponse;
import java.sql.Connection;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 살아 있는지 묻는 곳. 로그인 없이 열려 있고(SecurityConfig), compose 의 healthcheck 와 외부 모니터가 부른다.
 *
 * <p>DB 커넥션을 하나 빌려 2초 안에 응답하는지만 본다. 안 되면 503 이라서 compose 가 백엔드를 "아직 준비 안 됨"으로 두고
 * nginx 를 그 뒤에 띄운다. 회원 수나 버전 같은 내부 정보는 내보내지 않는다.
 */
@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/health")
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        boolean dbUp;
        try (Connection connection = dataSource.getConnection()) {
            dbUp = connection.isValid(2);
        } catch (Exception exception) {
            dbUp = false;
        }
        Map<String, String> body = Map.of("status", dbUp ? "UP" : "DOWN", "db", dbUp ? "UP" : "DOWN");
        if (!dbUp) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.fail("SERVICE_UNAVAILABLE", "데이터베이스에 연결할 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(body));
    }
}
