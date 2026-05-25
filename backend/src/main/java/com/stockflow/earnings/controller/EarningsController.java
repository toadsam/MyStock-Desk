package com.stockflow.earnings.controller;

import com.stockflow.earnings.dto.EarningsCalendarDto;
import com.stockflow.earnings.dto.EarningsDto;
import com.stockflow.earnings.service.EarningsService;
import com.stockflow.global.response.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EarningsController {

    private final EarningsService earningsService;

    @GetMapping("/api/earnings/calendar")
    public ApiResponse<List<EarningsCalendarDto>> calendar() {
        return ApiResponse.success(earningsService.getCalendar());
    }

    @GetMapping("/api/stocks/{symbol}/earnings")
    public ApiResponse<List<EarningsDto>> earnings(@PathVariable String symbol) {
        return ApiResponse.success(earningsService.getEarnings(symbol));
    }

    @GetMapping("/api/stocks/{symbol}/financials")
    public ApiResponse<List<EarningsDto>> financials(@PathVariable String symbol) {
        return ApiResponse.success(earningsService.getFinancials(symbol));
    }
}
