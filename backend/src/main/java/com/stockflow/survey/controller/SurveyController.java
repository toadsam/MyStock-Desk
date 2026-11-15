package com.stockflow.survey.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.survey.dto.SurveySubmitRequest;
import com.stockflow.survey.dto.SurveySummaryDto;
import com.stockflow.survey.service.SurveyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    /** 설문 답을 받는다. 로그인 없이 부를 수 있다(SecurityConfig). */
    @PostMapping
    public ApiResponse<Void> submit(@Valid @RequestBody SurveySubmitRequest request, HttpServletRequest httpRequest) {
        // 운영에서는 nginx 뒤라 X-Forwarded-For 가 실제 주소다(prod 프로파일의 forward-headers-strategy).
        surveyService.submit(request, httpRequest.getRemoteAddr());
        return ApiResponse.success();
    }

    /** 모인 답의 요약. 로그인한 관리자만. */
    @GetMapping("/summary")
    public ApiResponse<SurveySummaryDto> summary() {
        return ApiResponse.success(surveyService.summary());
    }
}
