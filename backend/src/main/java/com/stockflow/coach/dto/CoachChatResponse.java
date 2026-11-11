package com.stockflow.coach.dto;

import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import java.util.List;

/**
 * @param source         "AI" 면 모델이 쓴 답, "RULE" 이면 정해진 문장으로 만든 답.
 * @param remainingToday 오늘 남은 AI 답변 횟수. AI 가 꺼져 있으면 null.
 */
public record CoachChatResponse(
        CoachMessageDto answer,
        List<String> suggestedQuestions,
        MyWaveDashboardDto context,
        String source,
        Integer remainingToday
) {
}
