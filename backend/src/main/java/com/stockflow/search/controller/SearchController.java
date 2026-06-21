package com.stockflow.search.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.search.dto.SearchResultDto;
import com.stockflow.search.service.SearchService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ApiResponse<List<SearchResultDto>> search(@RequestParam(required = false) String query) {
        return ApiResponse.success(searchService.search(query));
    }
}
