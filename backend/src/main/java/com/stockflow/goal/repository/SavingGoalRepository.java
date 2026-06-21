package com.stockflow.goal.repository;

import com.stockflow.goal.entity.SavingGoal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingGoalRepository extends JpaRepository<SavingGoal, Long> {
    List<SavingGoal> findByMemberIdOrderByPriorityAscTargetDateAsc(Long memberId);

    List<SavingGoal> findByMemberIdAndStatusOrderByPriorityAscTargetDateAsc(Long memberId, String status);
}
