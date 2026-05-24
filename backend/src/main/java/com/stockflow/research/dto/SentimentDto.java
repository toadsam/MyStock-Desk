package com.stockflow.research.dto;

public record SentimentDto(
        Integer positive,
        Integer negative,
        Integer neutral,
        Integer total,
        Double sentimentScore
) {
}
