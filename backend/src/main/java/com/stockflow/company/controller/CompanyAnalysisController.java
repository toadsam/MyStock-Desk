package com.stockflow.company.controller;

import com.stockflow.company.dto.CompanyAnalysisDto;
import com.stockflow.company.service.CompanyAnalysisService;
import com.stockflow.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyAnalysisController {

    private final CompanyAnalysisService companyAnalysisService;

    @GetMapping("/{symbol}/analysis")
    public ApiResponse<CompanyAnalysisDto> analysis(@PathVariable String symbol) {
        return ApiResponse.success(companyAnalysisService.analyze(symbol));
    }
}
