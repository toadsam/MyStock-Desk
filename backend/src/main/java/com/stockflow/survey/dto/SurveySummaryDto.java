package com.stockflow.survey.dto;

import java.time.LocalDateTime;
import java.util.List;

/** 모인 설문 답의 요약. 관리자만 본다. */
public record SurveySummaryDto(
        long total,
        long used,
        long looked,
        /** 만족도 평균(1~5). 답이 없으면 null. */
        Double satisfactionAverage,
        /** 만족도 1점부터 5점까지 각각 몇 명인지. */
        List<Long> satisfactionCounts,
        /** 추천 점수 평균(0~10). 답이 없으면 null. */
        Double npsAverage,
        /** NPS: 9~10점 비율에서 0~6점 비율을 뺀 값(-100~100). 답이 없으면 null. */
        Integer npsScore,
        List<Tally> best,
        List<Tally> pain,
        List<Tally> whyNot,
        List<Tally> wouldHelp,
        List<Comment> comments
) {

    /** 선택지 하나와 그걸 고른 사람 수. 많이 고른 순서로 온다. */
    public record Tally(String option, long count) {
    }

    public record Comment(String path, String text, LocalDateTime createdAt) {
    }
}
