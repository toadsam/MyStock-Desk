package com.stockflow.coach.dto;

/**
 * 코치 화면이 질문을 받기 전에 알아야 하는 것.
 *
 * @param aiEnabled      모델이 답을 쓰는지. false 면 정해진 문장으로 답하고, 바깥으로 나가는 것도 없다.
 * @param remainingToday 오늘 남은 AI 답변 횟수. AI 가 꺼져 있으면 null.
 * @param dailyLimit     하루에 받을 수 있는 AI 답변 수.
 */
public record CoachStatusDto(
        boolean aiEnabled,
        Integer remainingToday,
        int dailyLimit
) {
}
