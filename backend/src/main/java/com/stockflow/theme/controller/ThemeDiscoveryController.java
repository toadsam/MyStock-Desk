package com.stockflow.theme.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.theme.dto.ThemeDiscoveryDto;
import com.stockflow.theme.service.ThemeDiscoveryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/themes")
@RequiredArgsConstructor
public class ThemeDiscoveryController {

    private final ThemeDiscoveryService themeDiscoveryService;

    @GetMapping
    public ApiResponse<List<ThemeDiscoveryDto>> themes() {
        return ApiResponse.success(themeDiscoveryService.getThemes());
    }

    @GetMapping("/search")
    public ApiResponse<List<ThemeDiscoveryDto>> search(@RequestParam(defaultValue = "") String keyword) {
        return ApiResponse.success(themeDiscoveryService.search(keyword));
    }
}
