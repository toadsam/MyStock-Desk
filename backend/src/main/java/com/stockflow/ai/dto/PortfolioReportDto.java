package com.stockflow.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PortfolioReportDto(
        LocalDateTime generatedAt,
        String summary,
        List<String> performanceNotes,
        List<String> concentrationNotes,
        List<String> upcomingEarnings,
        List<String> recentReviewQuestions,
        List<String> studyCandidates,
        String disclaimer
) {
}
