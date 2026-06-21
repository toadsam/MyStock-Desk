package com.stockflow.coach.dto;

import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import java.util.List;

public record CoachChatResponse(
        CoachMessageDto answer,
        List<String> suggestedQuestions,
        MyWaveDashboardDto context
) {
}
