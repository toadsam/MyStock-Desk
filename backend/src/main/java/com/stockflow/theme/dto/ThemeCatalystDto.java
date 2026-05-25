package com.stockflow.theme.dto;

import java.util.List;

public record ThemeCatalystDto(
        String title,
        String description,
        List<String> impactPaths
) {
}
