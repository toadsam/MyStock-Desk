package com.stockflow.coach.controller;

import com.stockflow.coach.dto.CoachChatRequest;
import com.stockflow.coach.dto.CoachChatResponse;
import com.stockflow.coach.dto.CoachMessageDto;
import com.stockflow.coach.service.FinancialCoachService;
import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.global.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/financial-coach")
@RequiredArgsConstructor
public class FinancialCoachController {

    private final FinancialCoachService coachService;

    @GetMapping("/messages")
    public ApiResponse<List<CoachMessageDto>> messages() {
        return ApiResponse.success(coachService.messages());
    }

    @GetMapping("/context")
    public ApiResponse<MyWaveDashboardDto> context() {
        return ApiResponse.success(coachService.context());
    }

    @PostMapping("/chat")
    public ApiResponse<CoachChatResponse> chat(@Valid @RequestBody CoachChatRequest request) {
        return ApiResponse.success(coachService.chat(request));
    }
}
