package com.stockflow.expense.repository;

import com.stockflow.expense.entity.Expense;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(Long memberId, LocalDate startDate, LocalDate endDate);

    List<Expense> findByMemberIdOrderBySpentDateDesc(Long memberId);
}
