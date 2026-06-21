package com.stockflow.asset.controller;

import com.stockflow.asset.dto.AssetSummaryDto;
import com.stockflow.asset.dto.FinancialAccountDto;
import com.stockflow.asset.dto.FinancialAccountRequest;
import com.stockflow.asset.dto.MonthlyBudgetDto;
import com.stockflow.asset.dto.MonthlyBudgetRequest;
import com.stockflow.asset.service.AssetService;
import com.stockflow.global.response.ApiResponse;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping("/summary")
    public ApiResponse<AssetSummaryDto> summary(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return ApiResponse.success(assetService.getSummary(month));
    }

    @GetMapping("/accounts")
    public ApiResponse<List<FinancialAccountDto>> accounts() {
        return ApiResponse.success(assetService.getAccounts());
    }

    @PostMapping("/accounts")
    public ApiResponse<FinancialAccountDto> createAccount(@Valid @RequestBody FinancialAccountRequest request) {
        return ApiResponse.success(assetService.createAccount(request));
    }

    @PatchMapping("/accounts/{id}")
    public ApiResponse<FinancialAccountDto> updateAccount(@PathVariable Long id, @Valid @RequestBody FinancialAccountRequest request) {
        return ApiResponse.success(assetService.updateAccount(id, request));
    }

    @DeleteMapping("/accounts/{id}")
    public ApiResponse<Void> deleteAccount(@PathVariable Long id) {
        assetService.deleteAccount(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/budgets/monthly")
    public ApiResponse<MonthlyBudgetDto> upsertBudget(@RequestBody MonthlyBudgetRequest request) {
        return ApiResponse.success(assetService.upsertBudget(request));
    }
}
