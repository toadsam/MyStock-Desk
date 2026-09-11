package com.stockflow.expense.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.dto.ExpenseDto;
import com.stockflow.expense.dto.ExpenseTemplateDto;
import com.stockflow.expense.dto.ExpenseTemplateRequest;
import com.stockflow.expense.dto.TemplateLogRequest;
import com.stockflow.expense.dto.TemplateSuggestionDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.entity.ExpenseTemplate;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.expense.repository.ExpenseTemplateRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 퀵버튼을 만들고 누른다.
 *
 * <p>제안 로직이 이 서비스의 핵심이다. 사용자가 버튼을 직접 만들 필요 없이,
 * 같은 가게가 {@link #SUGGEST_THRESHOLD} 번 쌓이면 앱이 먼저 물어본다.
 */
@Service
@RequiredArgsConstructor
public class ExpenseTemplateService {

    /** 이만큼 반복되면 습관으로 본다. */
    static final int SUGGEST_THRESHOLD = 3;

    private final ExpenseTemplateRepository templateRepository;
    private final ExpenseRepository expenseRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public List<ExpenseTemplateDto> templates() {
        return templateRepository
                .findByMemberIdOrderByUsageCountDescLastUsedAtDesc(currentMemberProvider.currentMemberId())
                .stream()
                .map(ExpenseTemplateDto::from)
                .toList();
    }

    @Transactional
    public ExpenseTemplateDto create(ExpenseTemplateRequest request) {
        Long memberId = currentMemberProvider.currentMemberId();
        return templateRepository
                .findByMemberIdAndMerchantAndCategory(memberId, request.merchant(), request.category())
                .map(existing -> {
                    existing.update(request.name(), request.category(), request.merchant(), request.amount());
                    return ExpenseTemplateDto.from(existing);
                })
                .orElseGet(() -> ExpenseTemplateDto.from(templateRepository.save(ExpenseTemplate.builder()
                        .memberId(memberId)
                        .name(request.name())
                        .category(request.category())
                        .merchant(request.merchant())
                        .amount(request.amount())
                        .usageCount(0)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build())));
    }

    @Transactional
    public ExpenseTemplateDto update(Long id, ExpenseTemplateRequest request) {
        ExpenseTemplate template = findOwned(id);
        template.update(request.name(), request.category(), request.merchant(), request.amount());
        return ExpenseTemplateDto.from(template);
    }

    @Transactional
    public void delete(Long id) {
        templateRepository.delete(findOwned(id));
    }

    /** 버튼 한 번 누르기. 금액을 비워 보내면 버튼에 저장된 금액을 쓴다. */
    @Transactional
    public ExpenseDto log(Long id, TemplateLogRequest request) {
        ExpenseTemplate template = findOwned(id);
        BigDecimal amount = request == null || request.amount() == null || request.amount().signum() <= 0
                ? template.getAmount()
                : request.amount();
        LocalDate spentDate = request == null || request.spentDate() == null ? LocalDate.now() : request.spentDate();
        template.markUsed();
        Expense saved = expenseRepository.save(Expense.builder()
                .memberId(template.getMemberId())
                .category(template.getCategory())
                .merchant(template.getMerchant())
                .amount(amount)
                .spentDate(spentDate)
                .memo(template.getName())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return ExpenseDto.from(saved);
    }

    /**
     * 버튼으로 만들 만한 가게를 찾는다.
     *
     * <p>최근 기록에서 {@link #SUGGEST_THRESHOLD} 번 이상 나온 가게 중
     * 아직 버튼이 없는 것만 고른다. 금액은 그 가게에서 가장 자주 쓴 값이다.
     */
    public List<TemplateSuggestionDto> suggestions() {
        Long memberId = currentMemberProvider.currentMemberId();
        List<Expense> history = expenseRepository.findTop300ByMemberIdOrderBySpentDateDesc(memberId);
        return history.stream()
                .filter(expense -> expense.getMerchant() != null && !expense.getMerchant().isBlank())
                .collect(Collectors.groupingBy(Expense::getMerchant))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue().size() >= SUGGEST_THRESHOLD)
                .filter(entry -> !templateRepository.existsByMemberIdAndMerchant(memberId, entry.getKey()))
                .map(entry -> {
                    List<Expense> rows = entry.getValue();
                    return new TemplateSuggestionDto(
                            entry.getKey(),
                            mode(rows, Expense::getCategory),
                            mode(rows, Expense::getAmount),
                            rows.size(),
                            entry.getKey() + " " + rows.size() + "번째네요. 버튼으로 만들까요?");
                })
                .sorted(Comparator.comparingLong(TemplateSuggestionDto::usageCount).reversed())
                .limit(5)
                .toList();
    }

    /** 가장 자주 나온 값. 같은 가게라도 금액이 흔들리므로 평균보다 최빈값이 실제에 가깝다. */
    private <T> T mode(List<Expense> rows, java.util.function.Function<Expense, T> extractor) {
        Map<T, Long> counts = rows.stream()
                .map(extractor)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.groupingBy(value -> value, Collectors.counting()));
        return counts.entrySet().stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private ExpenseTemplate findOwned(Long id) {
        ExpenseTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("퀵버튼을 찾을 수 없습니다."));
        if (!template.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 퀵버튼입니다.");
        }
        return template;
    }
}
