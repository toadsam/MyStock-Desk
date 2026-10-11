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
import com.stockflow.global.type.TransactionType;
import com.stockflow.transaction.repository.InvestmentTransactionRepository;
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
    private final InvestmentTransactionRepository transactionRepository;
    private final ExpenseService expenseService;
    private final CurrentMemberProvider currentMemberProvider;

    public AssetSummaryDto getSummary(YearMonth month) {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth targetMonth = month == null ? YearMonth.now() : month;
        List<FinancialAccount> accounts = accountRepository.findByMemberIdOrderByIdAsc(memberId);
        MonthlyBudget budget = budgetOrEmpty(memberId, targetMonth);
        BigDecimal accountBalance = accounts.stream()
                .filter(account -> Boolean.TRUE.equals(account.getIncludedInAssets()))
                .map(FinancialAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal investmentAsset = portfolioRepository.findByMemberId(memberId)
                .map(Portfolio::getTotalAsset)
                .orElse(BigDecimal.ZERO);
        BigDecimal monthlyExpense = expenseService.getMonthlySummary(targetMonth).totalAmount();
        BigDecimal remainingLivingBudget = budget.getLivingBudgetAmount().subtract(monthlyExpense).max(BigDecimal.ZERO);
        // 투자 가능 금액은 이번 달 예산에 적어 둔 투자 계획에서 이번 달에 이미 산 금액을 뺀 것이다.
        // 예전 식은 남은 생활비까지 더해서, 밥값을 투자해도 된다고 말하고 있었다.
        BigDecimal boughtThisMonth = transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(memberId).stream()
                .filter(tx -> tx.getTransactionType() == TransactionType.BUY)
                .filter(tx -> tx.getTransactionDate() != null && YearMonth.from(tx.getTransactionDate()).equals(targetMonth))
                .map(tx -> tx.getTotalAmount() == null ? BigDecimal.ZERO : tx.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal investmentAvailable = budget.getPlannedInvestmentAmount().subtract(boughtThisMonth).max(BigDecimal.ZERO);
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
        return accountRepository.findByMemberIdOrderByIdAsc(currentMemberProvider.currentMemberId()).stream()
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

    /**
     * 그 달 예산이 없으면 전부 0 인 예산을 돌려준다. 저장하지는 않는다.
     * 예산을 정하지 않은 사람에게 남의 숫자를 대신 채워 넣지 않기 위해서다.
     */
    private MonthlyBudget budgetOrEmpty(Long memberId, YearMonth month) {
        return budgetRepository.findByMemberIdAndBudgetMonth(memberId, month)
                .orElseGet(() -> MonthlyBudget.builder()
                        .memberId(memberId)
                        .budgetMonth(month)
                        .incomeAmount(BigDecimal.ZERO)
                        .livingBudgetAmount(BigDecimal.ZERO)
                        .fixedExpenseAmount(BigDecimal.ZERO)
                        .plannedSavingAmount(BigDecimal.ZERO)
                        .plannedInvestmentAmount(BigDecimal.ZERO)
                        .build());
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
