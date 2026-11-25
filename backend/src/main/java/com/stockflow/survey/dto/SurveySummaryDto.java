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
        /** 하나만 고르는 질문들. 질문이 더해진 뒤의 답만 들어 있어서, 합계가 그 질문에 답한 사람 수다. */
        List<Tally> situation,
        List<Tally> invest,
        List<Tally> spendChange,
        /** 수익화 질문들(2026-11-25 부터): 며칠 써 봤는지, 돈을 내고 쓸 기능, 한 달에 낼 수 있는 금액. */
        List<Tally> usagePeriod,
        List<Tally> payFeatures,
        List<Tally> payPrice,
        /** 상황별로 나눈 만족도와 추천 지수. 답한 사람이 많은 상황부터 온다. */
        List<Segment> bySituation,
        List<Comment> comments
) {

    /** 선택지 하나와 그걸 고른 사람 수. 많이 고른 순서로 온다. */
    public record Tally(String option, long count) {
    }

    /** 한 상황을 고른 사람들: 몇 명인지, 그중 써 본 사람은 몇 명인지, 그 사람들의 만족도 평균과 추천 지수(답이 없으면 null). */
    public record Segment(String option, long responses, long used, Double satisfactionAverage, Integer npsScore) {
    }

    public record Comment(String path, String text, LocalDateTime createdAt) {
    }
}
