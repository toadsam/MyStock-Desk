package com.stockflow.expense.service;

import com.stockflow.asset.entity.MonthlyBudget;
import com.stockflow.asset.repository.MonthlyBudgetRepository;
import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.dto.CashFlowItemDto;
import com.stockflow.expense.dto.CashFlowSummaryDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.global.type.TransactionType;
import com.stockflow.transaction.entity.InvestmentTransaction;
import com.stockflow.transaction.repository.InvestmentTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 이번 달 돈 흐름. 소비와 투자 매수를 한 목록으로 모은다.
 *
 * <p>화면은 합치되 합계는 합치지 않는다. 배달비 2만원은 사라진 돈이고
 * 주식 2만원은 형태만 바뀐 내 돈이다. 둘을 더해 "이번 달 지출"로 보여주면
 * 저축률과 남은 생활비가 전부 틀어지고, 투자를 잘하고 있는 사용자가
 * 낭비했다고 오해하게 된다. 그래서 spentTotal 과 investedTotal 은 끝까지 따로 간다.
 *
 * <p>합치는 이유는 비교다. 배달비와 주식 매수가 같은 화면에 있어야
 * "배달비가 투자보다 많다"가 보인다.
 */
@Service
@RequiredArgsConstructor
public class CashFlowService {

    static final String KIND_SPEND = "SPEND";
    static final String KIND_INVEST = "INVEST";

    private final ExpenseRepository expenseRepository;
    private final InvestmentTransactionRepository investmentTransactionRepository;
    private final MonthlyBudgetRepository monthlyBudgetRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public CashFlowSummaryDto cashFlow(YearMonth month) {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth targetMonth = month == null ? YearMonth.now() : month;
        LocalDate start = targetMonth.atDay(1);
        LocalDate end = targetMonth.atEndOfMonth();

        List<CashFlowItemDto> items = new ArrayList<>();
        BigDecimal spentTotal = BigDecimal.ZERO;
        BigDecimal investedTotal = BigDecimal.ZERO;

        for (Expense expense : expenseRepository
                .findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(memberId, start, end)) {
            BigDecimal amount = nullSafe(expense.getAmount());
            spentTotal = spentTotal.add(amount);
            items.add(new CashFlowItemDto(
                    KIND_SPEND,
                    expense.getId(),
                    expense.getCategory(),
                    expense.getMerchant(),
                    amount,
                    expense.getSpentDate(),
                    false));
        }

        for (InvestmentTransaction transaction : investmentTransactionRepository
                .findByMemberIdOrderByTransactionDateDescCreatedAtDesc(memberId)) {
            if (transaction.getTransactionType() != TransactionType.BUY) {
                continue;
            }
            LocalDate date = transaction.getTransactionDate();
            if (date == null || date.isBefore(start) || date.isAfter(end)) {
                continue;
            }
            BigDecimal amount = nullSafe(transaction.getTotalAmount());
            investedTotal = investedTotal.add(amount);
            items.add(new CashFlowItemDto(
                    KIND_INVEST,
                    transaction.getId(),
                    "투자",
                    transaction.getStockName(),
                    amount,
                    date,
                    true));
        }

        items.sort(Comparator.comparing(CashFlowItemDto::date).reversed());

        MonthlyBudget budget = monthlyBudgetRepository
                .findByMemberIdAndBudgetMonth(memberId, targetMonth)
                .orElse(null);
        BigDecimal income = budget == null ? BigDecimal.ZERO : nullSafe(budget.getIncomeAmount());
        BigDecimal savedTotal = budget == null ? BigDecimal.ZERO : nullSafe(budget.getPlannedSavingAmount());
        BigDecimal keptTotal = savedTotal.add(investedTotal);
        BigDecimal remaining = income.subtract(spentTotal).subtract(keptTotal);

        return new CashFlowSummaryDto(
                targetMonth,
                income,
                spentTotal,
                investedTotal,
                savedTotal,
                keptTotal,
                remaining,
                items);
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
