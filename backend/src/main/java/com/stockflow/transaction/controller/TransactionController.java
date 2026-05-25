package com.stockflow.transaction.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.transaction.dto.CsvImportResultDto;
import com.stockflow.transaction.dto.HoldingSummaryDto;
import com.stockflow.transaction.dto.InvestmentTransactionDto;
import com.stockflow.transaction.dto.RiskAlertDto;
import com.stockflow.transaction.dto.TransactionRequest;
import com.stockflow.transaction.dto.TransactionSummaryDto;
import com.stockflow.transaction.service.TransactionService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/transactions")
    public ApiResponse<List<InvestmentTransactionDto>> transactions() {
        return ApiResponse.success(transactionService.getTransactions());
    }

    @PostMapping("/transactions")
    public ApiResponse<InvestmentTransactionDto> create(@Valid @RequestBody TransactionRequest request) {
        return ApiResponse.success(transactionService.create(request));
    }

    @GetMapping("/transactions/{id}")
    public ApiResponse<InvestmentTransactionDto> transaction(@PathVariable Long id) {
        return ApiResponse.success(transactionService.getTransaction(id));
    }

    @PatchMapping("/transactions/{id}")
    public ApiResponse<InvestmentTransactionDto> update(@PathVariable Long id, @Valid @RequestBody TransactionRequest request) {
        return ApiResponse.success(transactionService.update(id, request));
    }

    @DeleteMapping("/transactions/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        transactionService.delete(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/transactions/summary")
    public ApiResponse<TransactionSummaryDto> summary() {
        return ApiResponse.success(transactionService.getSummary());
    }

    @GetMapping("/transactions/timeline")
    public ApiResponse<List<InvestmentTransactionDto>> timeline() {
        return ApiResponse.success(transactionService.getTransactions());
    }

    @PostMapping("/transactions/import/csv")
    public ApiResponse<CsvImportResultDto> importCsv(@RequestParam("file") MultipartFile file) {
        return ApiResponse.success(transactionService.importCsv(file));
    }

    @GetMapping("/holdings")
    public ApiResponse<List<HoldingSummaryDto>> holdings() {
        return ApiResponse.success(transactionService.getHoldingSummaries());
    }

    @GetMapping("/holdings/{symbol}")
    public ApiResponse<HoldingSummaryDto> holding(@PathVariable String symbol) {
        return ApiResponse.success(transactionService.getHoldingSummary(symbol));
    }

    @GetMapping("/portfolio/risk-alerts")
    public ApiResponse<List<RiskAlertDto>> riskAlerts() {
        return ApiResponse.success(transactionService.getRiskAlerts());
    }
}
