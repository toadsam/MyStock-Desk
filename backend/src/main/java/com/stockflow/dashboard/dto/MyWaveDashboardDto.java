package com.stockflow.dashboard.dto;

import com.stockflow.asset.dto.AssetSummaryDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.portfolio.dto.AllocationDto;
import com.stockflow.portfolio.dto.PortfolioDto;
import java.math.BigDecimal;
import java.util.List;

public record MyWaveDashboardDto(
        BigDecimal totalAsset,
        BigDecimal remainingLivingBudget,
        BigDecimal investmentAvailableAmount,
        BigDecimal goalProgressRate,
        BigDecimal currentSavingAmount,
        BigDecimal remainingGoalAmount,
        AssetSummaryDto assetSummary,
        GoalSummaryDto goalSummary,
        ExpenseMonthlySummaryDto expenseSummary,
        PortfolioDto portfolio,
        List<AllocationDto> portfolioAllocation,
        List<String> insights
) {
}
