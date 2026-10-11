package com.stockflow.dashboard.service;

import com.stockflow.asset.entity.MonthlyBudget;
import com.stockflow.asset.repository.MonthlyBudgetRepository;
import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.dashboard.dto.TodayDto;
import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.global.type.TransactionType;
import com.stockflow.goal.service.GoalService;
import com.stockflow.portfolio.repository.PortfolioRepository;
import com.stockflow.transaction.repository.InvestmentTransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 홈 화면의 "오늘 더 써도 되는 돈"을 계산한다. 저장하지 않고 매번 기록에서 다시 계산한다. */
@Service
@RequiredArgsConstructor
public class TodayService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final MonthlyBudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final PortfolioRepository portfolioRepository;
    private final InvestmentTransactionRepository transactionRepository;
    private final GoalService goalService;
    private final CurrentMemberProvider currentMemberProvider;
    private final Clock clock;

    public TodayDto today() {
        Long memberId = currentMemberProvider.currentMemberId();
        LocalDate today = LocalDate.now(clock);
        YearMonth month = YearMonth.from(today);

        MonthlyBudget budget = budgetRepository.findByMemberIdAndBudgetMonth(memberId, month).orElse(null);
        BigDecimal living = budget == null ? BigDecimal.ZERO : orZero(budget.getLivingBudgetAmount());
        boolean budgetSet = living.signum() > 0;

        List<Expense> monthExpenses = expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                memberId, month.atDay(1), month.atEndOfMonth());
        BigDecimal spentBeforeToday = sum(monthExpenses.stream().filter(e -> e.getSpentDate().isBefore(today)).toList());
        List<Expense> todayRows = monthExpenses.stream().filter(e -> e.getSpentDate().equals(today)).toList();
        BigDecimal spentToday = sum(todayRows);

        int daysLeft = month.lengthOfMonth() - today.getDayOfMonth() + 1;
        BigDecimal dailyBudget = floorToHundred(living.subtract(spentBeforeToday).max(BigDecimal.ZERO)
                .divide(BigDecimal.valueOf(daysLeft), 0, RoundingMode.DOWN));
        BigDecimal baseline = floorToHundred(living.divide(BigDecimal.valueOf(month.lengthOfMonth()), 0, RoundingMode.DOWN));

        return new TodayDto(
                today,
                budgetSet,
                living,
                dailyBudget,
                spentToday,
                dailyBudget.subtract(spentToday).max(BigDecimal.ZERO),
                spentToday.subtract(dailyBudget).max(BigDecimal.ZERO),
                living.subtract(spentBeforeToday).subtract(spentToday).max(BigDecimal.ZERO),
                daysLeft,
                baseline,
                week(memberId, today),
                todayRows.stream()
                        .sorted(Comparator.comparing(Expense::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                        .map(ExpenseDto::from)
                        .toList(),
                goalService.getSummary().mainGoal(),
                investment(memberId, month, budget)
        );
    }

    private List<TodayDto.DaySpend> week(Long memberId, LocalDate today) {
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        List<Expense> rows = expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                memberId, monday, monday.plusDays(6));
        return IntStream.range(0, 7)
                .mapToObj(monday::plusDays)
                .map(day -> new TodayDto.DaySpend(
                        day,
                        sum(rows.stream().filter(e -> e.getSpentDate().equals(day)).toList()),
                        day.equals(today),
                        day.isAfter(today)))
                .toList();
    }

    private TodayDto.InvestmentGlance investment(Long memberId, YearMonth month, MonthlyBudget budget) {
        return portfolioRepository.findByMemberId(memberId)
                .map(portfolio -> {
                    BigDecimal planned = budget == null ? BigDecimal.ZERO : orZero(budget.getPlannedInvestmentAmount());
                    BigDecimal boughtThisMonth = transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(memberId).stream()
                            .filter(tx -> tx.getTransactionType() == TransactionType.BUY)
                            .filter(tx -> tx.getTransactionDate() != null && YearMonth.from(tx.getTransactionDate()).equals(month))
                            .map(tx -> orZero(tx.getTotalAmount()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new TodayDto.InvestmentGlance(
                            orZero(portfolio.getTotalEvaluationAmount()),
                            orZero(portfolio.getTotalReturnRate()),
                            planned,
                            planned.subtract(boughtThisMonth).max(BigDecimal.ZERO));
                })
                .orElse(null);
    }

    private static BigDecimal sum(List<Expense> rows) {
        return rows.stream().map(Expense::getAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal floorToHundred(BigDecimal value) {
        return value.divide(HUNDRED, 0, RoundingMode.DOWN).multiply(HUNDRED);
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
