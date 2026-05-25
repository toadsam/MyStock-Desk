package com.stockflow.memo.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.memo.dto.InvestmentMemoDto;
import com.stockflow.memo.dto.InvestmentMemoRequest;
import com.stockflow.memo.service.InvestmentMemoService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/investment-memos")
@RequiredArgsConstructor
public class InvestmentMemoController {

    private final InvestmentMemoService memoService;

    @GetMapping
    public ApiResponse<List<InvestmentMemoDto>> memos() {
        return ApiResponse.success(memoService.getMemos());
    }

    @PostMapping
    public ApiResponse<InvestmentMemoDto> create(@Valid @RequestBody InvestmentMemoRequest request) {
        return ApiResponse.success(memoService.create(request));
    }

    @PatchMapping("/{id}")
    public ApiResponse<InvestmentMemoDto> update(@PathVariable Long id, @Valid @RequestBody InvestmentMemoRequest request) {
        return ApiResponse.success(memoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        memoService.delete(id);
        return ApiResponse.success(null);
    }
}
