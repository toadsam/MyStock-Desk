package com.stockflow.expense.service;

import com.stockflow.asset.repository.MonthlyBudgetRepository;
import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.dto.ExpenseBlockerDto;
import com.stockflow.expense.dto.ExpenseCategorySummaryDto;
import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.expense.dto.ExpenseRequest;
import com.stockflow.expense.dto.ExpenseTrendDto;
import com.stockflow.expense.dto.MerchantSuggestionDto;
import com.stockflow.expense.dto.SavingSimulationRequest;
import com.stockflow.expense.dto.SavingSimulationResultDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.goal.dto.SavingGoalDto;
import com.stockflow.goal.service.GoalService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final MonthlyBudgetRepository budgetRepository;
    private final GoalService goalService;
    private final CurrentMemberProvider currentMemberProvider;
    private final Clock clock;

    public List<ExpenseDto> getExpenses(YearMonth month) {
        return getMonthlyExpenses(currentMemberProvider.currentMemberId(), resolveMonth(month)).stream()
                .map(ExpenseDto::from)
                .toList();
    }

    public ExpenseMonthlySummaryDto getMonthlySummary(YearMonth month) {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth targetMonth = resolveMonth(month);
        List<Expense> expenses = getMonthlyExpenses(memberId, targetMonth);
        // 이번 달은 아직 끝나지 않았다. 11일까지 쓴 돈을 지난 달 한 달 전체와 비교하면 늘 "줄었다"가 된다.
        // 그래서 이번 달이면 지난 달도 같은 날짜까지만 더하고, 일평균도 지난 날수로 나눈다.
        LocalDate today = LocalDate.now(clock);
        boolean inProgress = targetMonth.equals(YearMonth.from(today));
        int elapsedDays = inProgress ? today.getDayOfMonth() : targetMonth.lengthOfMonth();
        YearMonth previousMonth = targetMonth.minusMonths(1);
        LocalDate previousEnd = inProgress
                ? previousMonth.atDay(Math.min(today.getDayOfMonth(), previousMonth.lengthOfMonth()))
                : previousMonth.atEndOfMonth();
        List<Expense> previousExpenses = expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                memberId, previousMonth.atDay(1), previousEnd);
        BigDecimal total = sum(expenses);
        BigDecimal previousTotal = sum(previousExpenses);
        List<ExpenseCategorySummaryDto> categories = categorySummaries(expenses, total);
        List<ExpenseBlockerDto> blockers = blockers(categories);
        return new ExpenseMonthlySummaryDto(
                targetMonth,
                total,
                previousTotal,
                rate(total.subtract(previousTotal), previousTotal),
                total.divide(BigDecimal.valueOf(elapsedDays), 0, RoundingMode.HALF_UP),
                categories,
                blockers,
                trends(memberId, targetMonth)
        );
    }

    @Transactional
    public ExpenseDto create(ExpenseRequest request) {
        Expense saved = expenseRepository.save(Expense.builder()
                .memberId(currentMemberProvider.currentMemberId())
                .category(request.category())
                .merchant(request.merchant())
                .amount(request.amount())
                .spentDate(request.spentDate())
                .memo(request.memo())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return ExpenseDto.from(saved);
    }

    /** 확인 화면에서 고른 후보들을 한 번에 저장한다. 문자·캡처 경로가 공유한다. */
    @Transactional
    public List<ExpenseDto> createBulk(List<ExpenseRequest> requests) {
        Long memberId = currentMemberProvider.currentMemberId();
        LocalDateTime now = LocalDateTime.now();
        List<Expense> saved = expenseRepository.saveAll(requests.stream()
                .map(request -> Expense.builder()
                        .memberId(memberId)
                        .category(request.category())
                        .merchant(request.merchant())
                        .amount(request.amount())
                        .spentDate(request.spentDate())
                        .memo(request.memo())
                        .createdAt(now)
                        .updatedAt(now)
                        .build())
                .toList());
        return saved.stream().map(ExpenseDto::from).toList();
    }

    /**
     * 가게 이름 자동완성.
     *
     * <p>새로 저장하는 데이터 없이 과거 기록만으로 계산한다. 사용자가 카테고리를 한 번
     * 고치면 그 값이 최빈값이 되므로, 고칠수록 제안이 정확해진다.
     */
    public List<MerchantSuggestionDto> suggestMerchants(String query) {
        List<Expense> history = expenseRepository
                .findTop300ByMemberIdOrderBySpentDateDesc(currentMemberProvider.currentMemberId());
        String normalized = query == null ? "" : query.replaceAll("\\s+", "").toUpperCase();
        return history.stream()
                .filter(expense -> expense.getMerchant() != null && !expense.getMerchant().isBlank())
                .filter(expense -> normalized.isEmpty()
                        || expense.getMerchant().replaceAll("\\s+", "").toUpperCase().contains(normalized))
                .collect(Collectors.groupingBy(Expense::getMerchant, LinkedHashMap::new, Collectors.toList()))
                .entrySet()
                .stream()
                .map(entry -> new MerchantSuggestionDto(
                        entry.getKey(),
                        mostCommon(entry.getValue(), Expense::getCategory),
                        mostCommon(entry.getValue(), Expense::getAmount),
                        entry.getValue().size()))
                .sorted(Comparator.comparingLong(MerchantSuggestionDto::usageCount).reversed())
                .limit(8)
                .toList();
    }

    private <T> T mostCommon(List<Expense> rows, java.util.function.Function<Expense, T> extractor) {
        return rows.stream()
                .map(extractor)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.groupingBy(value -> value, Collectors.counting()))
                .entrySet()
                .stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    @Transactional
    public ExpenseDto update(Long id, ExpenseRequest request) {
        Expense expense = findOwnedExpense(id);
        expense.update(request.category(), request.merchant(), request.amount(), request.spentDate(), request.memo());
        return ExpenseDto.from(expense);
    }

    @Transactional
    public void delete(Long id) {
        expenseRepository.delete(findOwnedExpense(id));
    }

    public SavingSimulationResultDto simulate(YearMonth month, SavingSimulationRequest request) {
        ExpenseMonthlySummaryDto summary = getMonthlySummary(month);
        Map<String, BigDecimal> savings = new LinkedHashMap<>();
        BigDecimal variableSaving = BigDecimal.ZERO;
        Map<String, BigDecimal> reductionRates = request == null || request.categoryReductionRates() == null
                ? Map.of("배달비", BigDecimal.valueOf(20), "카페", BigDecimal.valueOf(15), "쇼핑", BigDecimal.valueOf(10))
                : request.categoryReductionRates();
        for (ExpenseCategorySummaryDto category : summary.categories()) {
            BigDecimal reductionRate = reductionRates.get(category.category());
            if (reductionRate == null) {
                continue;
            }
            BigDecimal saved = category.amount().multiply(reductionRate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            savings.put(category.category(), saved);
            variableSaving = variableSaving.add(saved);
        }
        BigDecimal fixed = request == null || request.fixedSavingAmount() == null ? BigDecimal.ZERO : request.fixedSavingAmount();
        BigDecimal totalSaving = variableSaving.add(fixed);
        // 아낀 돈이 그대로 가장 가까운 목표로 들어간다고 보고 달성률을 다시 계산한다.
        SavingGoalDto mainGoal = goalService.getSummary().mainGoal();
        BigDecimal currentRate = mainGoal == null ? BigDecimal.ZERO : mainGoal.progressRate();
        BigDecimal expectedRate = mainGoal == null || mainGoal.targetAmount().signum() == 0
                ? BigDecimal.ZERO
                : mainGoal.currentAmount().add(totalSaving)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(mainGoal.targetAmount(), 1, RoundingMode.HALF_UP)
                        .min(BigDecimal.valueOf(100));
        return new SavingSimulationResultDto(currentRate, expectedRate, totalSaving, savings);
    }

    private Expense findOwnedExpense(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("소비 내역을 찾을 수 없습니다."));
        if (!expense.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 소비 내역입니다.");
        }
        return expense;
    }

    /** 기록이 없으면 빈 목록이다. 비어 있는 달을 데모 소비로 채우지 않는다. */
    private List<Expense> getMonthlyExpenses(Long memberId, YearMonth month) {
        return expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                memberId,
                month.atDay(1),
                month.atEndOfMonth()
        );
    }

    private List<ExpenseCategorySummaryDto> categorySummaries(List<Expense> expenses, BigDecimal total) {
        return expenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory, LinkedHashMap::new, Collectors.toList()))
                .entrySet()
                .stream()
                .map(entry -> {
                    BigDecimal amount = sum(entry.getValue());
                    long count = entry.getValue().size();
                    return new ExpenseCategorySummaryDto(
                            entry.getKey(),
                            amount,
                            rate(amount, total),
                            count,
                            amount.divide(BigDecimal.valueOf(count), 0, RoundingMode.HALF_UP)
                    );
                })
                .sorted(Comparator.comparing(ExpenseCategorySummaryDto::amount).reversed())
                .toList();
    }

    private List<ExpenseBlockerDto> blockers(List<ExpenseCategorySummaryDto> categories) {
        List<ExpenseCategorySummaryDto> top = categories.stream()
                .limit(3)
                .toList();
        return java.util.stream.IntStream.range(0, top.size())
                .mapToObj(index -> new ExpenseBlockerDto(
                        index + 1,
                        top.get(index).category(),
                        top.get(index).amount(),
                        top.get(index).count(),
                        top.get(index).ratio().divide(BigDecimal.valueOf(10), 1, RoundingMode.HALF_UP).negate()
                ))
                .toList();
    }

    private List<ExpenseTrendDto> trends(Long memberId, YearMonth targetMonth) {
        // 오래된 달부터 이번 달까지 여섯 달. 예산은 그 달에 정해 둔 생활비이고, 없으면 0 이다.
        return java.util.stream.IntStream.rangeClosed(0, 5)
                .mapToObj(index -> targetMonth.minusMonths(5 - index))
                .map(month -> {
                    BigDecimal amount = sum(expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                            memberId,
                            month.atDay(1),
                            month.atEndOfMonth()
                    ));
                    BigDecimal budget = budgetRepository.findByMemberIdAndBudgetMonth(memberId, month)
                            .map(found -> found.getLivingBudgetAmount())
                            .orElse(BigDecimal.ZERO);
                    return new ExpenseTrendDto(month.toString(), amount, budget, amount.multiply(BigDecimal.valueOf(0.2)).setScale(0, RoundingMode.HALF_UP));
                })
                .toList();
    }

    private BigDecimal sum(List<Expense> expenses) {
        return expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal rate(BigDecimal value, BigDecimal base) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return value.multiply(BigDecimal.valueOf(100)).divide(base, 1, RoundingMode.HALF_UP);
    }

    private YearMonth resolveMonth(YearMonth month) {
        return month == null ? YearMonth.now(clock) : month;
    }
}
