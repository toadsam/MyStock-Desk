package com.stockflow.expense.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.dto.ExpenseBlockerDto;
import com.stockflow.expense.dto.ExpenseCategorySummaryDto;
import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.expense.dto.ExpenseRequest;
import com.stockflow.expense.dto.ExpenseTrendDto;
import com.stockflow.expense.dto.SavingSimulationRequest;
import com.stockflow.expense.dto.SavingSimulationResultDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final CurrentMemberProvider currentMemberProvider;

    public List<ExpenseDto> getExpenses(YearMonth month) {
        return getMonthlyExpenses(currentMemberProvider.currentMemberId(), resolveMonth(month)).stream()
                .map(ExpenseDto::from)
                .toList();
    }

    public ExpenseMonthlySummaryDto getMonthlySummary(YearMonth month) {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth targetMonth = resolveMonth(month);
        List<Expense> expenses = getMonthlyExpenses(memberId, targetMonth);
        List<Expense> previousExpenses = getMonthlyExpenses(memberId, targetMonth.minusMonths(1));
        BigDecimal total = sum(expenses);
        BigDecimal previousTotal = sum(previousExpenses);
        List<ExpenseCategorySummaryDto> categories = categorySummaries(expenses, total);
        List<ExpenseBlockerDto> blockers = blockers(categories);
        return new ExpenseMonthlySummaryDto(
                targetMonth,
                total,
                previousTotal,
                rate(total.subtract(previousTotal), previousTotal),
                total.divide(BigDecimal.valueOf(targetMonth.lengthOfMonth()), 0, RoundingMode.HALF_UP),
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
        BigDecimal currentRate = BigDecimal.valueOf(63);
        BigDecimal expectedRate = currentRate.add(totalSaving.divide(BigDecimal.valueOf(10000), 1, RoundingMode.HALF_UP)).min(BigDecimal.valueOf(100));
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

    private List<Expense> getMonthlyExpenses(Long memberId, YearMonth month) {
        List<Expense> expenses = expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                memberId,
                month.atDay(1),
                month.atEndOfMonth()
        );
        if (!expenses.isEmpty()) {
            return expenses;
        }
        if (month.equals(YearMonth.now())) {
            seedDemoExpenses(memberId, month);
            return expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(memberId, month.atDay(1), month.atEndOfMonth());
        }
        return List.of();
    }

    private void seedDemoExpenses(Long memberId, YearMonth month) {
        expenseRepository.saveAll(List.of(
                demo(memberId, "배달비", "배달의민족", 399800, month.atDay(3)),
                demo(memberId, "쇼핑", "온라인 쇼핑", 299600, month.atDay(8)),
                demo(memberId, "식비", "마트", 249200, month.atDay(12)),
                demo(memberId, "카페", "카페", 174300, month.atDay(18)),
                demo(memberId, "교통", "대중교통", 125600, month.atDay(21))
        ));
    }

    private Expense demo(Long memberId, String category, String merchant, long amount, LocalDate date) {
        return Expense.builder()
                .memberId(memberId)
                .category(category)
                .merchant(merchant)
                .amount(BigDecimal.valueOf(amount))
                .spentDate(date)
                .memo("MyWave 데모 소비")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
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
        return java.util.stream.IntStream.rangeClosed(5, 0)
                .mapToObj(offset -> targetMonth.minusMonths(offset))
                .map(month -> {
                    BigDecimal amount = sum(expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                            memberId,
                            month.atDay(1),
                            month.atEndOfMonth()
                    ));
                    if (amount.compareTo(BigDecimal.ZERO) == 0 && month.equals(targetMonth)) {
                        amount = BigDecimal.valueOf(1_248_500);
                    }
                    return new ExpenseTrendDto(month.toString(), amount, BigDecimal.valueOf(1_100_000), amount.multiply(BigDecimal.valueOf(0.2)).setScale(0, RoundingMode.HALF_UP));
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
        return month == null ? YearMonth.now() : month;
    }
}
