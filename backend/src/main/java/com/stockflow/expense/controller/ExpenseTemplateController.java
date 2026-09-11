package com.stockflow.expense.controller;

import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.dto.ExpenseTemplateDto;
import com.stockflow.expense.dto.ExpenseTemplateRequest;
import com.stockflow.expense.dto.TemplateLogRequest;
import com.stockflow.expense.dto.TemplateSuggestionDto;
import com.stockflow.expense.service.ExpenseTemplateService;
import com.stockflow.global.response.ApiResponse;
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
@RequestMapping("/api/expense-templates")
@RequiredArgsConstructor
public class ExpenseTemplateController {

    private final ExpenseTemplateService expenseTemplateService;

    @GetMapping
    public ApiResponse<List<ExpenseTemplateDto>> templates() {
        return ApiResponse.success(expenseTemplateService.templates());
    }

    /** 앱이 먼저 제안할 후보. 같은 가게가 여러 번 쌓였는데 아직 버튼이 없는 것들. */
    @GetMapping("/suggestions")
    public ApiResponse<List<TemplateSuggestionDto>> suggestions() {
        return ApiResponse.success(expenseTemplateService.suggestions());
    }

    @PostMapping
    public ApiResponse<ExpenseTemplateDto> create(@Valid @RequestBody ExpenseTemplateRequest request) {
        return ApiResponse.success(expenseTemplateService.create(request));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ExpenseTemplateDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseTemplateRequest request) {
        return ApiResponse.success(expenseTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        expenseTemplateService.delete(id);
        return ApiResponse.success(null);
    }

    /** 퀵버튼 한 번 누르기. 이 호출 하나로 소비 기록이 끝난다. */
    @PostMapping("/{id}/log")
    public ApiResponse<ExpenseDto> log(
            @PathVariable Long id,
            @RequestBody(required = false) TemplateLogRequest request) {
        return ApiResponse.success(expenseTemplateService.log(id, request));
    }
}
