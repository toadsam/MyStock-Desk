package com.stockflow.expense.controller;

import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.expense.dto.ExpenseRequest;
import com.stockflow.expense.dto.SavingSimulationRequest;
import com.stockflow.expense.dto.SavingSimulationResultDto;
import com.stockflow.expense.service.ExpenseService;
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
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

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
