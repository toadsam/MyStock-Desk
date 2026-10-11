package com.stockflow.dashboard.controller;

import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.dashboard.dto.TodayDto;
import com.stockflow.dashboard.service.MyWaveDashboardService;
import com.stockflow.dashboard.service.TodayService;
import com.stockflow.global.response.ApiResponse;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class MyWaveDashboardController {

    private final MyWaveDashboardService dashboardService;
    private final TodayService todayService;

    @GetMapping("/mywave")
    public ApiResponse<MyWaveDashboardDto> dashboard(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return ApiResponse.success(dashboardService.dashboard(month));
    }

    /** 홈 화면. 오늘 더 써도 되는 돈, 이번 주 소비, 오늘 기록, 가장 가까운 목표, 투자 요약. */
    @GetMapping("/today")
    public ApiResponse<TodayDto> today() {
        return ApiResponse.success(todayService.today());
    }
}
