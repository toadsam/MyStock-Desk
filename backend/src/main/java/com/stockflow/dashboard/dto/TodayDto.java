package com.stockflow.dashboard.dto;

import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.goal.dto.SavingGoalDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 홈 화면 한 장에 필요한 숫자 전부.
 *
 * <p>핵심은 {@code remainingToday} 하나다. 이번 달 남은 생활비를 남은 날수로 나눈 것이
 * 오늘의 하루 예산이고, 거기서 오늘 쓴 돈을 뺀 것이 "오늘 더 써도 되는 돈"이다.
 * 오늘 덜 쓰면 그만큼 내일의 하루 예산이 늘어나고, 더 쓰면 줄어든다.
 *
 * @param budgetSet       이번 달 생활비 예산을 정해 두었는가. false 면 아래 예산 값은 전부 0 이다.
 * @param dailyBudget     오늘의 하루 예산. (생활비 − 어제까지 쓴 돈) ÷ 오늘 포함 남은 날수, 100원 단위 내림.
 * @param baselineDailyBudget 생활비 ÷ 이번 달 날수. 지난 날짜를 비교하는 기준선이다.
 * @param week            이번 주 월요일부터 일요일까지. 아직 오지 않은 날은 {@code future}.
 * @param mainGoal        목표일이 가장 가까운 진행 중 목표. 없으면 null.
 * @param investment      투자 요약. 포트폴리오가 없으면 null.
 */
public record TodayDto(
        LocalDate date,
        boolean budgetSet,
        BigDecimal monthlyLivingBudget,
        BigDecimal dailyBudget,
        BigDecimal spentToday,
        BigDecimal remainingToday,
        BigDecimal overToday,
        BigDecimal remainingLivingBudget,
        int daysLeftInMonth,
        BigDecimal baselineDailyBudget,
        List<DaySpend> week,
        List<ExpenseDto> todayExpenses,
        SavingGoalDto mainGoal,
        InvestmentGlance investment
) {

    public record DaySpend(LocalDate date, BigDecimal amount, boolean today, boolean future) {
    }

    /**
     * @param plannedThisMonth  이번 달 예산에 적어 둔 투자 계획 금액.
     * @param remainingThisMonth 계획에서 이번 달 매수 금액을 뺀 것. 0 아래로 내려가지 않는다.
     */
    public record InvestmentGlance(
            BigDecimal evaluationAmount,
            BigDecimal returnRate,
            BigDecimal plannedThisMonth,
            BigDecimal remainingThisMonth
    ) {
    }
}
