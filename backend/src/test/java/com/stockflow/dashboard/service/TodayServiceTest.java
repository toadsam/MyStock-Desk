package com.stockflow.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.stockflow.asset.entity.MonthlyBudget;
import com.stockflow.asset.repository.MonthlyBudgetRepository;
import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.dashboard.dto.TodayDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.goal.service.GoalService;
import com.stockflow.portfolio.repository.PortfolioRepository;
import com.stockflow.transaction.repository.InvestmentTransactionRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TodayServiceTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final MonthlyBudgetRepository budgetRepository = mock(MonthlyBudgetRepository.class);
    private final ExpenseRepository expenseRepository = mock(ExpenseRepository.class);
    private final PortfolioRepository portfolioRepository = mock(PortfolioRepository.class);
    private final InvestmentTransactionRepository transactionRepository = mock(InvestmentTransactionRepository.class);
    private final GoalService goalService = mock(GoalService.class);
    private final CurrentMemberProvider currentMemberProvider = mock(CurrentMemberProvider.class);

    @BeforeEach
    void setUp() {
        when(currentMemberProvider.currentMemberId()).thenReturn(1L);
        when(portfolioRepository.findByMemberId(anyLong())).thenReturn(Optional.empty());
        when(goalService.getSummary()).thenReturn(new GoalSummaryDto(0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null));
    }

    @Test
    void 남은_생활비를_남은_날수로_나눈_것이_오늘의_하루_예산이다() {
        // 2026-10-11 일요일. 31일짜리 달이라 오늘 포함 21일이 남았다.
        LocalDate today = LocalDate.of(2026, 10, 11);
        givenBudget(today, 550_000);
        givenExpenses(List.of(
                expense(today.minusDays(3), 140_000),
                expense(today, 3_000),
                expense(today, 3_800)
        ));

        TodayDto result = service(today).today();

        assertThat(result.budgetSet()).isTrue();
        assertThat(result.daysLeftInMonth()).isEqualTo(21);
        // (550,000 − 140,000) ÷ 21 = 19,523 → 100원 단위 내림
        assertThat(result.dailyBudget()).isEqualByComparingTo("19500");
        assertThat(result.spentToday()).isEqualByComparingTo("6800");
        assertThat(result.remainingToday()).isEqualByComparingTo("12700");
        assertThat(result.overToday()).isEqualByComparingTo("0");
        assertThat(result.remainingLivingBudget()).isEqualByComparingTo("403200");
        // 550,000 ÷ 31 = 17,741 → 17,700
        assertThat(result.baselineDailyBudget()).isEqualByComparingTo("17700");
    }

    @Test
    void 하루_예산을_넘기면_남은_돈은_0이고_넘친_만큼을_따로_알려준다() {
        LocalDate today = LocalDate.of(2026, 10, 11);
        givenBudget(today, 550_000);
        givenExpenses(List.of(expense(today.minusDays(3), 140_000), expense(today, 25_000)));

        TodayDto result = service(today).today();

        assertThat(result.remainingToday()).isEqualByComparingTo("0");
        assertThat(result.overToday()).isEqualByComparingTo("5500");
    }

    @Test
    void 예산을_정하지_않았으면_남의_숫자를_채우지_않고_0을_돌려준다() {
        LocalDate today = LocalDate.of(2026, 10, 11);
        when(budgetRepository.findByMemberIdAndBudgetMonth(anyLong(), any())).thenReturn(Optional.empty());
        givenExpenses(List.of(expense(today, 4_000)));

        TodayDto result = service(today).today();

        assertThat(result.budgetSet()).isFalse();
        assertThat(result.dailyBudget()).isEqualByComparingTo("0");
        assertThat(result.spentToday()).isEqualByComparingTo("4000");
        assertThat(result.overToday()).isEqualByComparingTo("4000");
    }

    @Test
    void 이번_주는_월요일부터_일곱_날이고_오늘_뒤는_아직_오지_않은_날이다() {
        LocalDate thursday = LocalDate.of(2026, 10, 8);
        givenBudget(thursday, 550_000);
        givenExpenses(List.of(expense(LocalDate.of(2026, 10, 6), 9_000)));

        List<TodayDto.DaySpend> week = service(thursday).today().week();

        assertThat(week).hasSize(7);
        assertThat(week.get(0).date()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(week.get(1).amount()).isEqualByComparingTo("9000");
        assertThat(week.get(3).today()).isTrue();
        assertThat(week.get(4).future()).isTrue();
        assertThat(week.get(2).future()).isFalse();
    }

    private TodayService service(LocalDate today) {
        Clock clock = Clock.fixed(today.atTime(10, 0).atZone(SEOUL).toInstant(), SEOUL);
        return new TodayService(budgetRepository, expenseRepository, portfolioRepository,
                transactionRepository, goalService, currentMemberProvider, clock);
    }

    private void givenBudget(LocalDate today, long living) {
        when(budgetRepository.findByMemberIdAndBudgetMonth(eq(1L), eq(YearMonth.from(today))))
                .thenReturn(Optional.of(MonthlyBudget.builder()
                        .memberId(1L)
                        .budgetMonth(YearMonth.from(today))
                        .livingBudgetAmount(BigDecimal.valueOf(living))
                        .plannedInvestmentAmount(BigDecimal.ZERO)
                        .build()));
    }

    /** 저장소는 기간 조건을 무시하고 같은 목록을 돌려준다. 서비스가 날짜로 다시 거르는지까지 함께 확인된다. */
    private void givenExpenses(List<Expense> rows) {
        when(expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(anyLong(), any(), any()))
                .thenAnswer(invocation -> {
                    LocalDate from = invocation.getArgument(1);
                    LocalDate to = invocation.getArgument(2);
                    return rows.stream()
                            .filter(row -> !row.getSpentDate().isBefore(from) && !row.getSpentDate().isAfter(to))
                            .toList();
                });
    }

    private Expense expense(LocalDate day, long amount) {
        return Expense.builder()
                .memberId(1L)
                .category("식비")
                .merchant("테스트")
                .amount(BigDecimal.valueOf(amount))
                .spentDate(day)
                .createdAt(day.atTime(12, 0))
                .build();
    }
}
