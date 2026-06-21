package com.stockflow.search.dto;

public record SearchResultDto(
        String type,
        String title,
        String detail,
        String targetPath
) {
}
