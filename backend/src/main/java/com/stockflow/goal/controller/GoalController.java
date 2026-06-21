package com.stockflow.goal.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.goal.dto.GoalActionDto;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.goal.dto.SavingGoalDto;
import com.stockflow.goal.dto.SavingGoalRequest;
import com.stockflow.goal.service.GoalService;
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

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ApiResponse<List<SavingGoalDto>> goals(@RequestParam(required = false) String status) {
        return ApiResponse.success(goalService.getGoals(status));
    }

    @GetMapping("/summary")
    public ApiResponse<GoalSummaryDto> summary() {
        return ApiResponse.success(goalService.getSummary());
    }

    @GetMapping("/actions")
    public ApiResponse<List<GoalActionDto>> actions() {
        return ApiResponse.success(goalService.recommendedActions());
    }

    @PostMapping
    public ApiResponse<SavingGoalDto> create(@Valid @RequestBody SavingGoalRequest request) {
        return ApiResponse.success(goalService.create(request));
    }

    @PatchMapping("/{id}")
    public ApiResponse<SavingGoalDto> update(@PathVariable Long id, @Valid @RequestBody SavingGoalRequest request) {
        return ApiResponse.success(goalService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        goalService.delete(id);
        return ApiResponse.success(null);
    }
}
