package com.stockflow.expense.controller;

import com.stockflow.expense.dto.BulkExpenseRequest;
import com.stockflow.expense.dto.CashFlowSummaryDto;
import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.expense.dto.ExpenseRequest;
import com.stockflow.expense.dto.MerchantSuggestionDto;
import com.stockflow.expense.dto.ParseResultDto;
import com.stockflow.expense.dto.ParseSmsRequest;
import com.stockflow.expense.dto.SavingSimulationRequest;
import com.stockflow.expense.dto.SavingSimulationResultDto;
import com.stockflow.expense.service.CashFlowService;
import com.stockflow.expense.service.ExpenseImportService;
import com.stockflow.expense.service.ExpenseService;
import com.stockflow.global.response.ApiResponse;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final ExpenseImportService expenseImportService;
    private final CashFlowService cashFlowService;

    @GetMapping
    public ApiResponse<List<ExpenseDto>> expenses(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return ApiResponse.success(expenseService.getExpenses(month));
    }

    @GetMapping("/monthly-summary")
    public ApiResponse<ExpenseMonthlySummaryDto> monthlySummary(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return ApiResponse.success(expenseService.getMonthlySummary(month));
    }

    @PostMapping
    public ApiResponse<ExpenseDto> create(@Valid @RequestBody ExpenseRequest request) {
        return ApiResponse.success(expenseService.create(request));
    }

    /**
     * 카드 승인 문자를 읽어 후보 목록으로 돌려준다. 저장하지 않는다.
     * 사용자가 확인 화면에서 고른 것만 {@link #createBulk} 로 저장된다.
     */
    @PostMapping("/parse-sms")
    public ApiResponse<ParseResultDto> parseSms(@Valid @RequestBody ParseSmsRequest request) {
        return ApiResponse.success(expenseImportService.parseSms(request.text()));
    }

    /**
     * 결제 내역 캡처를 읽어 후보 목록으로 돌려준다. 저장하지 않는다.
     * 이미지는 분석에만 쓰고 서버에 남기지 않는다.
     */
    @PostMapping("/parse-image")
    public ApiResponse<ParseResultDto> parseImage(@RequestParam("file") MultipartFile file) {
        return ApiResponse.success(expenseImportService.parseImage(file));
    }

    /** 캡처 분석을 지금 쓸 수 있는지와 오늘 남은 횟수. */
    @GetMapping("/import-status")
    public ApiResponse<Map<String, Object>> importStatus() {
        return ApiResponse.success(Map.of(
                "imageParsingAvailable", expenseImportService.imageParsingAvailable(),
                "remainingImageQuota", expenseImportService.remainingImageQuota(),
                "dailyImageLimit", ExpenseImportService.DAILY_IMAGE_LIMIT
        ));
    }

    @PostMapping("/bulk")
    public ApiResponse<List<ExpenseDto>> createBulk(@Valid @RequestBody BulkExpenseRequest request) {
        return ApiResponse.success(expenseService.createBulk(request.items()));
    }

    @GetMapping("/merchants/suggest")
    public ApiResponse<List<MerchantSuggestionDto>> suggestMerchants(@RequestParam(required = false) String q) {
        return ApiResponse.success(expenseService.suggestMerchants(q));
    }

    @GetMapping("/cash-flow")
    public ApiResponse<CashFlowSummaryDto> cashFlow(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return ApiResponse.success(cashFlowService.cashFlow(month));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ExpenseDto> update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ApiResponse.success(expenseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/saving-simulation")
    public ApiResponse<SavingSimulationResultDto> simulate(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month,
            @RequestBody(required = false) SavingSimulationRequest request
    ) {
        return ApiResponse.success(expenseService.simulate(month, request));
    }
}
