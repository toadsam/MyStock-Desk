package com.stockflow.coach.repository;

import com.stockflow.coach.entity.FinancialCoachMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCoachMessageRepository extends JpaRepository<FinancialCoachMessage, Long> {
    List<FinancialCoachMessage> findTop20ByMemberIdOrderByCreatedAtDesc(Long memberId);
}
