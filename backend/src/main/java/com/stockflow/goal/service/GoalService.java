package com.stockflow.goal.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.goal.dto.GoalActionDto;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.goal.dto.SavingGoalDto;
import com.stockflow.goal.dto.SavingGoalRequest;
import com.stockflow.goal.entity.SavingGoal;
import com.stockflow.goal.repository.SavingGoalRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GoalService {

    private static final String ACTIVE = "ACTIVE";

    private final SavingGoalRepository goalRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public List<SavingGoalDto> getGoals(String status) {
        Long memberId = currentMemberProvider.currentMemberId();
        List<SavingGoal> allGoals = ensureDemoGoals(memberId);
        List<SavingGoal> goals = status == null || status.isBlank()
                ? allGoals
                : allGoals.stream()
                .filter(goal -> status.equals(goal.getStatus()))
                .toList();
        return goals.stream()
                .map(goal -> SavingGoalDto.of(goal, recommendedActions()))
                .toList();
    }

    public GoalSummaryDto getSummary() {
        List<SavingGoalDto> activeGoals = getGoals(ACTIVE);
        BigDecimal totalProgress = activeGoals.stream()
                .map(SavingGoalDto::progressRate)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageProgress = activeGoals.isEmpty()
                ? BigDecimal.ZERO
                : totalProgress.divide(BigDecimal.valueOf(activeGoals.size()), 1, RoundingMode.HALF_UP);
        BigDecimal remaining = activeGoals.stream()
                .map(SavingGoalDto::remainingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal monthlyRequired = activeGoals.stream()
                .map(goal -> goal.dailyRequiredAmount().multiply(BigDecimal.valueOf(30)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        SavingGoalDto mainGoal = activeGoals.stream()
                .min(Comparator.comparing(SavingGoalDto::remainingDays))
                .orElse(null);
        return new GoalSummaryDto(activeGoals.size(), averageProgress, monthlyRequired, remaining, mainGoal);
    }

    @Transactional
    public SavingGoalDto create(SavingGoalRequest request) {
        SavingGoal saved = goalRepository.save(SavingGoal.builder()
                .memberId(currentMemberProvider.currentMemberId())
                .title(request.title())
                .targetAmount(request.targetAmount())
                .currentAmount(request.currentAmount() == null ? BigDecimal.ZERO : request.currentAmount())
                .targetDate(request.targetDate())
                .status(resolveStatus(request.status()))
                .priority(request.priority() == null ? 10 : request.priority())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return SavingGoalDto.of(saved, recommendedActions());
    }

    @Transactional
    public SavingGoalDto update(Long id, SavingGoalRequest request) {
        SavingGoal goal = findOwnedGoal(id);
        goal.update(
                request.title(),
                request.targetAmount(),
                request.currentAmount() == null ? BigDecimal.ZERO : request.currentAmount(),
                request.targetDate(),
                resolveStatus(request.status()),
                request.priority() == null ? goal.getPriority() : request.priority()
        );
        return SavingGoalDto.of(goal, recommendedActions());
    }

    @Transactional
    public void delete(Long id) {
        goalRepository.delete(findOwnedGoal(id));
    }

    public SavingGoalDto getMainGoal() {
        return getGoals(ACTIVE).stream()
                .min(Comparator.comparing(SavingGoalDto::remainingDays))
                .orElse(null);
    }

    public List<GoalActionDto> recommendedActions() {
        return List.of(
                new GoalActionDto("배달비 줄이기", "주 2회 줄이면 목표에 더 가까워져요.", BigDecimal.valueOf(78000), "배달비", 92),
                new GoalActionDto("카페 지출 줄이기", "테이크아웃 횟수를 조정해보세요.", BigDecimal.valueOf(45000), "카페", 78),
                new GoalActionDto("구독 정리", "잘 쓰지 않는 정기결제를 점검하세요.", BigDecimal.valueOf(32000), "구독", 68)
        );
    }

    private SavingGoal findOwnedGoal(Long id) {
        SavingGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("목표를 찾을 수 없습니다."));
        if (!goal.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 목표입니다.");
        }
        return goal;
    }

    private List<SavingGoal> ensureDemoGoals(Long memberId) {
        List<SavingGoal> goals = goalRepository.findByMemberIdOrderByPriorityAscTargetDateAsc(memberId);
        if (!goals.isEmpty()) {
            return goals;
        }
        LocalDate today = LocalDate.now();
        goalRepository.saveAll(List.of(
                demo(memberId, "다음 달까지 100만원 모으기", 1_000_000, 630_000, today.plusDays(16), ACTIVE, 1),
                demo(memberId, "비상금 만들기", 3_000_000, 2_250_000, today.plusDays(90), ACTIVE, 2),
                demo(memberId, "여행 자금", 2_000_000, 840_000, today.plusDays(120), ACTIVE, 3)
        ));
        return goalRepository.findByMemberIdOrderByPriorityAscTargetDateAsc(memberId);
    }

    private SavingGoal demo(Long memberId, String title, long target, long current, LocalDate targetDate, String status, int priority) {
        return SavingGoal.builder()
                .memberId(memberId)
                .title(title)
                .targetAmount(BigDecimal.valueOf(target))
                .currentAmount(BigDecimal.valueOf(current))
                .targetDate(targetDate)
                .status(status)
                .priority(priority)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private String resolveStatus(String status) {
        return status == null || status.isBlank() ? ACTIVE : status;
    }
}
