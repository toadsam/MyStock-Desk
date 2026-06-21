package com.stockflow.dashboard.service;

import com.stockflow.asset.dto.AssetSummaryDto;
import com.stockflow.asset.service.AssetService;
import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.expense.service.ExpenseService;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.goal.dto.SavingGoalDto;
import com.stockflow.goal.service.GoalService;
import com.stockflow.portfolio.dto.AllocationDto;
import com.stockflow.portfolio.dto.PortfolioDto;
import com.stockflow.portfolio.service.PortfolioService;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyWaveDashboardService {

    private final AssetService assetService;
    private final GoalService goalService;
    private final ExpenseService expenseService;
    private final PortfolioService portfolioService;

    public MyWaveDashboardDto dashboard(YearMonth month) {
        YearMonth targetMonth = month == null ? YearMonth.now() : month;
        AssetSummaryDto assetSummary = assetService.getSummary(targetMonth);
        GoalSummaryDto goalSummary = goalService.getSummary();
        ExpenseMonthlySummaryDto expenseSummary = expenseService.getMonthlySummary(targetMonth);
        PortfolioDto portfolio = tryPortfolio();
        List<AllocationDto> allocation = tryAllocation();
        SavingGoalDto mainGoal = goalSummary.mainGoal();
        return new MyWaveDashboardDto(
                assetSummary.totalAsset(),
                assetSummary.remainingLivingBudget(),
                assetSummary.investmentAvailableAmount(),
                mainGoal == null ? BigDecimal.ZERO : mainGoal.progressRate(),
                mainGoal == null ? BigDecimal.ZERO : mainGoal.currentAmount(),
                mainGoal == null ? BigDecimal.ZERO : mainGoal.remainingAmount(),
                assetSummary,
                goalSummary,
                expenseSummary,
                portfolio,
                allocation,
                insights(assetSummary, goalSummary, expenseSummary)
        );
    }

    private List<String> insights(AssetSummaryDto assetSummary, GoalSummaryDto goalSummary, ExpenseMonthlySummaryDto expenseSummary) {
        return List.of(
                "남은 생활비는 " + assetSummary.remainingLivingBudget().toPlainString() + "원이고, 투자 가능 금액은 " + assetSummary.investmentAvailableAmount().toPlainString() + "원입니다.",
                "목표 달성률은 평균 " + goalSummary.averageProgressRate().toPlainString() + "%입니다.",
                expenseSummary.goalBlockers().isEmpty()
                        ? "이번 달 목표를 방해하는 주요 소비가 아직 없습니다."
                        : expenseSummary.goalBlockers().get(0).category() + " 지출이 목표 달성에 가장 큰 영향을 주고 있습니다."
        );
    }

    private PortfolioDto tryPortfolio() {
        try {
            return portfolioService.getPortfolio();
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private List<AllocationDto> tryAllocation() {
        try {
            return portfolioService.getAllocation();
        } catch (RuntimeException exception) {
            return List.of();
        }
    }
}
