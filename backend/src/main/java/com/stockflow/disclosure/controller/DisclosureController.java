package com.stockflow.disclosure.controller;

import com.stockflow.disclosure.dto.DisclosureDto;
import com.stockflow.disclosure.service.DisclosureService;
import com.stockflow.global.response.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/disclosures")
@RequiredArgsConstructor
public class DisclosureController {

    private final DisclosureService disclosureService;

    @GetMapping("/sec")
    public ApiResponse<List<DisclosureDto>> secDisclosures(
            @RequestParam(required = false) String symbols,
            @RequestParam(required = false) Integer limit
    ) {
        return ApiResponse.success(disclosureService.getSecDisclosures(symbols, limit));
    }
}
