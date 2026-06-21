package com.stockflow.dashboard.controller;

import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.dashboard.service.MyWaveDashboardService;
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

    @GetMapping("/mywave")
    public ApiResponse<MyWaveDashboardDto> dashboard(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return ApiResponse.success(dashboardService.dashboard(month));
    }
}
