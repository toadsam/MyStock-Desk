package com.stockflow.coach.repository;

import com.stockflow.coach.entity.FinancialCoachMessage;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCoachMessageRepository extends JpaRepository<FinancialCoachMessage, Long> {
    List<FinancialCoachMessage> findTop20ByMemberIdOrderByCreatedAtDesc(Long memberId);

    /** 이 사람이 그 시각 이후에 보낸 질문 수. 하루 횟수 제한에 쓴다. */
    long countByMemberIdAndRoleAndCreatedAtGreaterThanEqual(Long memberId, String role, LocalDateTime from);

    /** 모든 사람이 그 시각 이후에 보낸 질문 수. 서비스 전체의 하루 상한에 쓴다. */
    long countByRoleAndCreatedAtGreaterThanEqual(String role, LocalDateTime from);
}
