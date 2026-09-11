package com.stockflow.expense.repository;

import com.stockflow.expense.entity.ExpenseTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseTemplateRepository extends JpaRepository<ExpenseTemplate, Long> {
    List<ExpenseTemplate> findByMemberIdOrderByUsageCountDescLastUsedAtDesc(Long memberId);

    Optional<ExpenseTemplate> findByMemberIdAndMerchantAndCategory(Long memberId, String merchant, String category);

    boolean existsByMemberIdAndMerchant(Long memberId, String merchant);
}
