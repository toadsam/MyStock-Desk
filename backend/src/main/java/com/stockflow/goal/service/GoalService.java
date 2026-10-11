package com.stockflow.goal.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.goal.dto.GoalActionDto;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.goal.dto.SavingGoalDto;
import com.stockflow.goal.dto.SavingGoalRequest;
import com.stockflow.goal.entity.SavingGoal;
import com.stockflow.goal.repository.SavingGoalRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.YearMonth;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
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

    private static final BigDecimal REDUCTION_RATE = BigDecimal.valueOf(20);

    private final SavingGoalRepository goalRepository;
    private final ExpenseRepository expenseRepository;
    private final CurrentMemberProvider currentMemberProvider;
    private final Clock clock;

    public List<SavingGoalDto> getGoals(String status) {
        Long memberId = currentMemberProvider.currentMemberId();
        List<SavingGoal> allGoals = goalRepository.findByMemberIdOrderByPriorityAscTargetDateAsc(memberId);
        List<SavingGoal> goals = status == null || status.isBlank()
                ? allGoals
                : allGoals.stream()
                .filter(goal -> status.equals(goal.getStatus()))
                .toList();
        List<GoalActionDto> actions = recommendedActions();
        return goals.stream()
                .map(goal -> SavingGoalDto.of(goal, actions))
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

    /**
     * 이번 달 가장 많이 쓴 카테고리 세 곳을 20% 줄였을 때 남는 돈.
     *
     * <p>예전에는 "배달비 줄이기 월 24,000원" 같은 고정 목록이었다. 배달을 안 시키는 사람에게도
     * 배달을 줄이라고 했다. 이제 그 사람이 실제로 돈을 쓴 곳에서만 고른다. 기록이 없으면 빈 목록이다.
     * impactScore 는 그 카테고리가 이번 달 소비에서 차지하는 비율(%)이다.
     */
    public List<GoalActionDto> recommendedActions() {
        Long memberId = currentMemberProvider.currentMemberId();
        YearMonth month = YearMonth.now(clock);
        List<Expense> rows = expenseRepository.findByMemberIdAndSpentDateBetweenOrderBySpentDateDesc(
                memberId, month.atDay(1), month.atEndOfMonth());
        BigDecimal total = rows.stream().map(Expense::getAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.signum() == 0) {
            return List.of();
        }
        Map<String, List<Expense>> byCategory = rows.stream()
                .filter(row -> row.getCategory() != null && row.getAmount() != null)
                .collect(Collectors.groupingBy(Expense::getCategory));
        return byCategory.entrySet().stream()
                .map(entry -> Map.entry(entry.getKey(), entry.getValue().stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(3)
                .map(entry -> {
                    String category = entry.getKey();
                    BigDecimal spent = entry.getValue();
                    int count = byCategory.get(category).size();
                    BigDecimal saving = spent.multiply(REDUCTION_RATE)
                            .divide(BigDecimal.valueOf(100 * 100L), 0, RoundingMode.DOWN)
                            .multiply(BigDecimal.valueOf(100));
                    int share = spent.multiply(BigDecimal.valueOf(100)).divide(total, 0, RoundingMode.HALF_UP).intValue();
                    return new GoalActionDto(
                            category + " 20% 줄이기",
                            String.format("이번 달 %d번 썼어요. 다섯 번 중 한 번만 참으면 돼요.", count),
                            saving,
                            category,
                            share);
                })
                .toList();
    }

    private SavingGoal findOwnedGoal(Long id) {
        SavingGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("목표를 찾을 수 없습니다."));
        if (!goal.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 목표입니다.");
        }
        return goal;
    }

    private String resolveStatus(String status) {
        return status == null || status.isBlank() ? ACTIVE : status;
    }
}
