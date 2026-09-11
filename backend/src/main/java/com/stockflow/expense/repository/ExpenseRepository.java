package com.stockflow.expense.repository;

import com.stockflow.expense.entity.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(Long memberId, LocalDate startDate, LocalDate endDate);

    List<Expense> findByMemberIdOrderBySpentDateDesc(Long memberId);

    /** 카테고리 추측과 가게 이름 자동완성의 재료. 최근 기록일수록 사용자의 지금 습관에 가깝다. */
    List<Expense> findTop300ByMemberIdOrderBySpentDateDesc(Long memberId);

    /** 중복 등록 검사. 같은 가게에서 같은 날 같은 금액을 쓴 기록이 이미 있는가. */
    boolean existsByMemberIdAndMerchantAndAmountAndSpentDate(
            Long memberId, String merchant, BigDecimal amount, LocalDate spentDate);
}
