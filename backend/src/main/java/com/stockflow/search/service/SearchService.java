package com.stockflow.search.service;

import com.stockflow.expense.dto.ExpenseCategorySummaryDto;
import com.stockflow.expense.service.ExpenseService;
import com.stockflow.goal.service.GoalService;
import com.stockflow.portfolio.service.PortfolioService;
import com.stockflow.search.dto.SearchResultDto;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final GoalService goalService;
    private final ExpenseService expenseService;
    private final PortfolioService portfolioService;

    public List<SearchResultDto> search(String query) {
        String keyword = query == null ? "" : query.trim().toLowerCase();
        List<SearchResultDto> results = new ArrayList<>();
        goalService.getGoals(null).forEach(goal -> results.add(new SearchResultDto(
                "GOAL",
                goal.title(),
                "목표 달성률 " + goal.progressRate() + "%",
                "/goals"
        )));
        expenseService.getMonthlySummary(YearMonth.now()).categories().forEach(category -> results.add(spending(category)));
        portfolioService.getHoldings().forEach(holding -> results.add(new SearchResultDto(
                "HOLDING",
                holding.stock().symbol() + " " + holding.stock().name(),
                "수익률 " + holding.returnRate() + "%",
                "/company/" + holding.stock().symbol()
        )));
        goalService.recommendedActions().forEach(action -> results.add(new SearchResultDto(
                "ACTION",
                action.title(),
                action.monthlySavingAmount() + "원 절약 가능",
                "/spending/simulation"
        )));

        if (keyword.isBlank()) {
            return results;
        }
        return results.stream()
                .filter(result -> (result.title() + " " + result.detail()).toLowerCase().contains(keyword))
                .toList();
    }

    private SearchResultDto spending(ExpenseCategorySummaryDto category) {
        return new SearchResultDto(
                "SPENDING",
                category.category(),
                "이번 달 " + category.amount() + "원 지출",
                "/spending/detail"
        );
    }
}
