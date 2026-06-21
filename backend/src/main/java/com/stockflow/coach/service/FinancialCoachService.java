package com.stockflow.coach.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.coach.dto.CoachChatRequest;
import com.stockflow.coach.dto.CoachChatResponse;
import com.stockflow.coach.dto.CoachMessageDto;
import com.stockflow.coach.entity.FinancialCoachMessage;
import com.stockflow.coach.repository.FinancialCoachMessageRepository;
import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.dashboard.service.MyWaveDashboardService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FinancialCoachService {

    private final FinancialCoachMessageRepository messageRepository;
    private final MyWaveDashboardService dashboardService;
    private final CurrentMemberProvider currentMemberProvider;

    public List<CoachMessageDto> messages() {
        Long memberId = currentMemberProvider.currentMemberId();
        List<FinancialCoachMessage> messages = messageRepository.findTop20ByMemberIdOrderByCreatedAtDesc(memberId);
        if (messages.isEmpty()) {
            FinancialCoachMessage welcome = saveMessage(memberId, "ASSISTANT", "안녕하세요. 목표, 소비, 투자 흐름을 함께 보고 이번 달 재무 상태를 정리해드릴게요.");
            return List.of(CoachMessageDto.from(welcome));
        }
        return messages.stream()
                .sorted(Comparator.comparing(FinancialCoachMessage::getCreatedAt))
                .map(CoachMessageDto::from)
                .toList();
    }

    public MyWaveDashboardDto context() {
        return dashboardService.dashboard(null);
    }

    @Transactional
    public CoachChatResponse chat(CoachChatRequest request) {
        Long memberId = currentMemberProvider.currentMemberId();
        saveMessage(memberId, "USER", request.message());
        MyWaveDashboardDto context = dashboardService.dashboard(null);
        FinancialCoachMessage answer = saveMessage(memberId, "ASSISTANT", answer(request.message(), context));
        return new CoachChatResponse(CoachMessageDto.from(answer), suggestedQuestions(), context);
    }

    public List<String> suggestedQuestions() {
        return List.of(
                "이번 달 돈 상태 요약",
                "포트폴리오 위험도",
                "목표 달성 방법",
                "기업 재무 요약"
        );
    }

    private FinancialCoachMessage saveMessage(Long memberId, String role, String content) {
        return messageRepository.save(FinancialCoachMessage.builder()
                .memberId(memberId)
                .role(role)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String answer(String message, MyWaveDashboardDto context) {
        String normalized = message == null ? "" : message.toLowerCase();
        if (normalized.contains("투자")) {
            return "이번 달 투자 가능 금액은 " + context.investmentAvailableAmount().toPlainString()
                    + "원입니다. 목표 달성률과 남은 생활비를 같이 보면, 이 금액 안에서 분할 투자하는 쪽이 현재 흐름에 맞습니다.";
        }
        if (normalized.contains("줄") || normalized.contains("소비") || normalized.contains("지출")) {
            String blocker = context.expenseSummary().goalBlockers().isEmpty()
                    ? "큰 소비 항목"
                    : context.expenseSummary().goalBlockers().get(0).category();
            return blocker + " 지출을 먼저 점검하는 것이 좋습니다. 이 항목을 10~20% 줄이면 목표 달성률을 바로 끌어올릴 수 있습니다.";
        }
        if (normalized.contains("목표")) {
            return "현재 주요 목표 달성률은 " + context.goalProgressRate().toPlainString()
                    + "%이고 남은 금액은 " + context.remainingGoalAmount().toPlainString()
                    + "원입니다. 지금 페이스를 유지하되 고정 지출과 반복 소비를 같이 줄이면 안정적으로 달성할 수 있습니다.";
        }
        return "현재 총자산은 " + context.totalAsset().toPlainString()
                + "원, 남은 생활비는 " + context.remainingLivingBudget().toPlainString()
                + "원입니다. 목표와 투자 여력을 같이 보면 이번 달은 소비 조정 후 남는 금액을 우선 확인하는 흐름이 좋습니다.";
    }
}
