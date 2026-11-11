package com.stockflow.coach.service;

import com.stockflow.global.format.Formats;
import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.coach.dto.CoachChatRequest;
import com.stockflow.coach.dto.CoachChatResponse;
import com.stockflow.coach.dto.CoachMessageDto;
import com.stockflow.coach.dto.CoachStatusDto;
import com.stockflow.coach.dto.CoachNewsDto;
import com.stockflow.coach.entity.FinancialCoachMessage;
import com.stockflow.coach.news.CoachNewsFinder;
import com.stockflow.coach.repository.FinancialCoachMessageRepository;
import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.dashboard.service.MyWaveDashboardService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FinancialCoachService {

    private static final String USER = "USER";
    private static final String ASSISTANT = "ASSISTANT";

    private final FinancialCoachMessageRepository messageRepository;
    private final MyWaveDashboardService dashboardService;
    private final CurrentMemberProvider currentMemberProvider;
    private final CoachAiAnswerer aiAnswerer;
    private final CoachNewsFinder newsFinder;
    private final Clock clock;

    /** 한 사람이 하루에 받을 수 있는 AI 답변 수. 넘으면 정해진 답으로 알려 준다. */
    @Value("${stockflow.coach.daily-limit:30}")
    private int dailyLimit;

    /** 모든 사람을 합친 하루 상한. 누가 계정을 여러 개 만들어 돌려도 비용이 여기서 멈춘다. */
    @Value("${stockflow.coach.global-daily-limit:1500}")
    private int globalDailyLimit;

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

    public CoachStatusDto status() {
        if (!aiAnswerer.isEnabled()) {
            return new CoachStatusDto(false, null, dailyLimit);
        }
        Long memberId = currentMemberProvider.currentMemberId();
        long askedToday = messageRepository.countByMemberIdAndRoleAndCreatedAtGreaterThanEqual(
                memberId, USER, LocalDate.now(clock).atStartOfDay());
        return new CoachStatusDto(true, (int) Math.max(0, dailyLimit - askedToday), dailyLimit);
    }

    public MyWaveDashboardDto context() {
        return dashboardService.dashboard(null);
    }

    /**
     * 질문 하나에 답한다.
     *
     * <p>AI 가 켜져 있고 오늘 횟수가 남았으면 모델이 답을 쓴다. 꺼져 있거나, 횟수를 다 썼거나,
     * 모델을 부르지 못했거나, 모델의 답이 검사에 걸리면 정해진 문장으로 답한다. 그래서 코치는 언제나 답을 한다.
     *
     * <p>일부러 트랜잭션으로 묶지 않는다. 모델을 기다리는 몇 초 동안 DB 연결을 붙잡고 있지 않기 위해서다.
     */
    public CoachChatResponse chat(CoachChatRequest request) {
        Long memberId = currentMemberProvider.currentMemberId();
        String question = request.message().trim();
        LocalDateTime startOfToday = LocalDate.now(clock).atStartOfDay();

        // 이번 질문을 저장하기 전에 센다. 앞선 대화도 이번 질문이 섞이기 전에 읽어 둔다.
        long askedToday = messageRepository.countByMemberIdAndRoleAndCreatedAtGreaterThanEqual(memberId, USER, startOfToday);
        long askedByEveryone = messageRepository.countByRoleAndCreatedAtGreaterThanEqual(USER, startOfToday);
        List<FinancialCoachMessage> history = messageRepository.findTop20ByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .sorted(Comparator.comparing(FinancialCoachMessage::getCreatedAt))
                .toList();

        saveMessage(memberId, USER, question);
        MyWaveDashboardDto context = dashboardService.dashboard(null);

        boolean aiOn = aiAnswerer.isEnabled();
        boolean overMyLimit = askedToday >= dailyLimit;
        boolean overGlobalLimit = askedByEveryone >= globalDailyLimit;

        String aiAnswer = aiOn && !overMyLimit && !overGlobalLimit ? aiAnswerer.answer(question, history) : null;
        // 질문에 종목이 나오면 최근 기사를 붙인다. 판단은 하지 않고 읽을거리만 건넨다.
        CoachNewsDto news = newsFinder.find(question).orElse(null);

        String content;
        if (aiAnswer != null) {
            content = aiAnswer;
        } else {
            // 종목을 물었는데 모델이 답하지 못하면, 숫자 요약 대신 판단은 못 한다는 말부터 한다.
            String ruleAnswer = news != null ? "투자 판단은 제가 대신해 드릴 수 없어요." : answer(question, context);
            content = aiOn && overMyLimit
                    ? "오늘 받을 수 있는 AI 답변 " + dailyLimit + "번을 다 썼어요. 내일 다시 물어봐 주세요.\n" + ruleAnswer
                    : ruleAnswer;
        }
        if (news != null && !content.contains("소식") && !content.contains("기사")) {
            content = content + "\n대신 " + news.stockName() + "의 최근 소식을 아래에 모아 봤어요.";
        }

        FinancialCoachMessage answer = saveMessage(memberId, ASSISTANT, content);
        Integer remainingToday = aiOn ? (int) Math.max(0, dailyLimit - askedToday - 1) : null;
        return new CoachChatResponse(
                CoachMessageDto.from(answer),
                suggestedQuestions(),
                context,
                aiAnswer != null ? "AI" : "RULE",
                remainingToday,
                news);
    }

    public List<String> suggestedQuestions() {
        return List.of(
                "이번 달 소비 어땠어?",
                "오늘 얼마까지 써도 돼?",
                "목표까지 얼마나 남았어?",
                "어디를 줄이면 좋을까?"
        );
    }

    private FinancialCoachMessage saveMessage(Long memberId, String role, String content) {
        return messageRepository.save(FinancialCoachMessage.builder()
                .memberId(memberId)
                .role(role)
                .content(content)
                .createdAt(LocalDateTime.now(clock))
                .build());
    }

    /** 정해진 문장으로 만드는 답. AI 를 쓸 수 없을 때의 대비책이다. */
    private String answer(String message, MyWaveDashboardDto context) {
        String normalized = message == null ? "" : message.toLowerCase();
        if (normalized.contains("투자")) {
            // 예전에는 "분할 투자하는 쪽이 맞습니다"라고 권했다. 투자 조언은 하지 않기로 해서 숫자만 알린다.
            return "투자 판단은 제가 대신해 드릴 수 없어요. 이번 달 투자 계획에서 남은 금액은 "
                    + Formats.won(context.investmentAvailableAmount()) + "이에요.";
        }
        if (normalized.contains("줄") || normalized.contains("소비") || normalized.contains("지출")) {
            String blocker = context.expenseSummary().goalBlockers().isEmpty()
                    ? "큰 소비 항목"
                    : context.expenseSummary().goalBlockers().get(0).category();
            return blocker + " 지출을 먼저 점검하는 것이 좋습니다. 이 항목을 10~20% 줄이면 목표 달성률을 바로 끌어올릴 수 있습니다.";
        }
        if (normalized.contains("목표")) {
            return "현재 주요 목표 달성률은 " + Formats.rate(context.goalProgressRate())
                    + "이고 남은 금액은 " + Formats.won(context.remainingGoalAmount())
                    + "입니다. 지금 페이스를 유지하되 고정 지출과 반복 소비를 같이 줄이면 안정적으로 달성할 수 있습니다.";
        }
        return "현재 총자산은 " + Formats.won(context.totalAsset())
                + ", 남은 생활비는 " + Formats.won(context.remainingLivingBudget())
                + "입니다. 목표와 투자 여력을 같이 보면 이번 달은 소비 조정 후 남는 금액을 우선 확인하는 흐름이 좋습니다.";
    }
}
