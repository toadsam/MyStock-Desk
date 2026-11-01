package com.stockflow.global.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 다른 주소에서 온 브라우저 요청을 받아 줄지.
 *
 * <p>허용 주소는 {@code stockflow.cors.allowed-origins}(환경변수 {@code STOCKFLOW_CORS_ALLOWED_ORIGINS})에서 읽는다.
 * 개발 기본값은 Vite 주소들이고, 운영은 nginx 가 같은 주소에서 /api 를 백엔드로 넘겨 주므로 비어 있다.
 * 비어 있으면 아무 매핑도 등록하지 않아 다른 주소에서 온 요청은 브라우저가 막는다.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final List<String> allowedOrigins;

    public CorsConfig(@Value("${stockflow.cors.allowed-origins:}") List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins.stream()
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (allowedOrigins.isEmpty()) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
