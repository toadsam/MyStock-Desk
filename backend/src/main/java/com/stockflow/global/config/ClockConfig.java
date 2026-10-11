package com.stockflow.global.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * "오늘"을 정하는 시계.
 *
 * <p>하루 예산은 날짜가 바뀌는 순간 다시 계산되므로, 서버가 어느 시간대에서 돌든
 * 사용자가 사는 한국 날짜를 기준으로 삼는다. 테스트에서는 이 빈을 고정 시계로 바꿔 끼운다.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Asia/Seoul"));
    }
}
