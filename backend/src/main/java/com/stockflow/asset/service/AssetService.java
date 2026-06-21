package com.stockflow.asset.service;

import com.stockflow.asset.dto.AssetSummaryDto;
import com.stockflow.asset.dto.FinancialAccountDto;
import com.stockflow.asset.dto.FinancialAccountRequest;
import com.stockflow.asset.dto.MonthlyBudgetDto;
import com.stockflow.asset.dto.MonthlyBudgetRequest;
import com.stockflow.asset.entity.FinancialAccount;
import com.stockflow.asset.entity.MonthlyBudget;
import com.stockflow.asset.repository.FinancialAccountRepository;
import com.stockflow.asset.repository.MonthlyBudgetRepository;
import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.service.ExpenseService;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.PortfolioRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final FinancialAccountRepository accountRepository;
    private final MonthlyBudgetRepository budgetRepository;
    private final PortfolioRepository portfolioRepository;
    private final ExpenseService expenseService;
    private final CurrentMemberProvider currentMemberProvider;

    public AssetSummaryDto getSummary(YearMonth month) {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth targetMonth = month == null ? YearMonth.now() : month;
        List<FinancialAccount> accounts = ensureDemoAccounts(memberId);
        MonthlyBudget budget = ensureBudget(memberId, targetMonth);
        BigDecimal accountBalance = accounts.stream()
                .filter(account -> Boolean.TRUE.equals(account.getIncludedInAssets()))
                .map(FinancialAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal investmentAsset = portfolioRepository.findByMemberId(memberId)
                .map(Portfolio::getTotalAsset)
                .orElse(BigDecimal.valueOf(24_850_000));
        BigDecimal monthlyExpense = expenseService.getMonthlySummary(targetMonth).totalAmount();
        BigDecimal remainingLivingBudget = budget.getLivingBudgetAmount().subtract(monthlyExpense).max(BigDecimal.ZERO);
        BigDecimal investmentAvailable = remainingLivingBudget
                .add(budget.getPlannedInvestmentAmount())
                .subtract(budget.getPlannedSavingAmount().divide(BigDecimal.valueOf(2), 0, RoundingMode.HALF_UP))
                .max(BigDecimal.ZERO);
        BigDecimal savingRate = budget.getIncomeAmount().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : budget.getPlannedSavingAmount().multiply(BigDecimal.valueOf(100)).divide(budget.getIncomeAmount(), 1, RoundingMode.HALF_UP);
        return new AssetSummaryDto(
                targetMonth,
                accountBalance.add(investmentAsset),
                accountBalance,
                investmentAsset,
                budget.getIncomeAmount(),
                monthlyExpense,
                remainingLivingBudget,
                investmentAvailable,
                savingRate,
                accounts.stream().map(FinancialAccountDto::from).toList(),
                MonthlyBudgetDto.from(budget)
        );
    }

    public List<FinancialAccountDto> getAccounts() {
        return ensureDemoAccounts(currentMemberProvider.currentMemberId()).stream()
                .map(FinancialAccountDto::from)
                .toList();
    }

    @Transactional
    public FinancialAccountDto createAccount(FinancialAccountRequest request) {
        FinancialAccount saved = accountRepository.save(FinancialAccount.builder()
                .memberId(currentMemberProvider.currentMemberId())
                .name(request.name())
                .accountType(request.accountType())
                .institutionName(request.institutionName())
                .balance(request.balance())
                .includedInAssets(request.includedInAssets() == null || request.includedInAssets())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return FinancialAccountDto.from(saved);
    }

    @Transactional
    public FinancialAccountDto updateAccount(Long id, FinancialAccountRequest request) {
        FinancialAccount account = findOwnedAccount(id);
        account.update(
                request.name(),
                request.accountType(),
                request.institutionName(),
                request.balance(),
                request.includedInAssets() == null || request.includedInAssets()
        );
        return FinancialAccountDto.from(account);
    }

    @Transactional
    public void deleteAccount(Long id) {
        accountRepository.delete(findOwnedAccount(id));
    }

    @Transactional
    public MonthlyBudgetDto upsertBudget(MonthlyBudgetRequest request) {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth budgetMonth = request.budgetMonth() == null ? YearMonth.now() : request.budgetMonth();
        MonthlyBudget budget = budgetRepository.findByMemberIdAndBudgetMonth(memberId, budgetMonth)
                .orElseGet(() -> budgetRepository.save(MonthlyBudget.builder()
                        .memberId(memberId)
                        .budgetMonth(budgetMonth)
                        .incomeAmount(BigDecimal.ZERO)
                        .livingBudgetAmount(BigDecimal.ZERO)
                        .fixedExpenseAmount(BigDecimal.ZERO)
                        .plannedSavingAmount(BigDecimal.ZERO)
                        .plannedInvestmentAmount(BigDecimal.ZERO)
                        .build()));
        budget.update(
                value(request.incomeAmount()),
                value(request.livingBudgetAmount()),
                value(request.fixedExpenseAmount()),
                value(request.plannedSavingAmount()),
                value(request.plannedInvestmentAmount())
        );
        return MonthlyBudgetDto.from(budget);
    }

    private List<FinancialAccount> ensureDemoAccounts(Long memberId) {
        List<FinancialAccount> accounts = accountRepository.findByMemberIdOrderByIdAsc(memberId);
        if (!accounts.isEmpty()) {
            return accounts;
        }
        accountRepository.saveAll(List.of(
                demoAccount(memberId, "입출금 통장", "BANK", "MyWave Bank", 3_200_000),
                demoAccount(memberId, "비상금 통장", "SAVINGS", "MyWave Bank", 2_250_000),
                demoAccount(memberId, "월급 계좌", "BANK", "MyWave Bank", 1_450_000)
        ));
        return accountRepository.findByMemberIdOrderByIdAsc(memberId);
    }

    private FinancialAccount demoAccount(Long memberId, String name, String type, String institutionName, long balance) {
        return FinancialAccount.builder()
                .memberId(memberId)
                .name(name)
                .accountType(type)
                .institutionName(institutionName)
                .balance(BigDecimal.valueOf(balance))
                .includedInAssets(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private MonthlyBudget ensureBudget(Long memberId, YearMonth month) {
        return budgetRepository.findByMemberIdAndBudgetMonth(memberId, month)
                .orElseGet(() -> budgetRepository.save(MonthlyBudget.builder()
                        .memberId(memberId)
                        .budgetMonth(month)
                        .incomeAmount(BigDecimal.valueOf(4_200_000))
                        .livingBudgetAmount(BigDecimal.valueOf(2_100_000))
                        .fixedExpenseAmount(BigDecimal.valueOf(620_000))
                        .plannedSavingAmount(BigDecimal.valueOf(630_000))
                        .plannedInvestmentAmount(BigDecimal.valueOf(530_000))
                        .build()));
    }

    private FinancialAccount findOwnedAccount(Long id) {
        FinancialAccount account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다."));
        if (!account.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 계좌입니다.");
        }
        return account;
    }

    private BigDecimal value(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
