package com.stockflow.survey.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 만족도 설문 답 한 건.
 *
 * <p>누가 답했는지는 남기지 않는다. 회원 번호도, 접속 주소도 없다. 로그인하지 않은 사람도 답할 수 있어야 하고,
 * 이름이 붙지 않아야 솔직한 답이 나온다. 여러 개 고르는 답은 '|' 로 이어 한 칸에 둔다.
 */
@Entity
@Table(name = "mywave_survey_response")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyResponse {

    /** 여러 개 고른 답을 한 칸에 이을 때 쓰는 글자. 답 안에는 들어올 수 없다(SurveySubmitRequest 가 막는다). */
    public static final String SEPARATOR = "|";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** USED(써 본 사람) 또는 LOOKED(구경만 한 사람). 뒤 질문이 이 값에 따라 갈린다. */
    @Column(nullable = false, length = 10)
    private String path;

    /** 1(별로)~5(최고). 써 본 사람만 답한다. */
    private Integer satisfaction;

    /** 추천하고 싶은 정도 0~10. 써 본 사람만 답한다. */
    private Integer nps;

    @Column(length = 600)
    private String best;

    @Column(length = 600)
    private String pain;

    @Column(length = 600)
    private String whyNot;

    @Column(length = 600)
    private String wouldHelp;

    /** 지금 어떤 상황인지. 하나만 고른다. 2026-11-21 에 더한 질문이라 그 전 답에는 없다. */
    @Column(length = 40)
    private String situation;

    /** 투자를 하고 있는지. 하나만 고른다. 2026-11-21 부터. */
    @Column(length = 40)
    private String invest;

    /** 써 보고 돈 쓰는 게 달라졌는지. 써 본 사람만 답한다. 2026-11-21 부터. */
    @Column(length = 40)
    private String spendChange;

    @Column(length = 300)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
