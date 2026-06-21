package com.stockflow.asset.repository;

import com.stockflow.asset.entity.MonthlyBudget;
import java.time.YearMonth;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudget, Long> {
    Optional<MonthlyBudget> findByMemberIdAndBudgetMonth(Long memberId, YearMonth budgetMonth);
}
