package com.stockflow.theme.dto;

import java.util.List;

public record ThemeAiExplanationDto(
        String summary,
        List<String> evidence,
        List<String> checkpoints,
        List<String> risks,
        String verdict,
        String generatedBy
) {
}
