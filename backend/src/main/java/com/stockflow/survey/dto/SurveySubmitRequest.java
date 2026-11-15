package com.stockflow.survey.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 설문 화면이 보내는 답.
 *
 * <p>로그인 없이 누구나 부를 수 있는 주소라서 크기를 좁게 묶는다. 고르는 답은 화면의 선택지 문구가 그대로 오는데,
 * 문구를 바꿀 때마다 서버를 고치지 않도록 문구 자체는 검사하지 않고 길이와 개수만 본다.
 */
public record SurveySubmitRequest(
        @NotNull(message = "써 봤는지 여부가 빠졌어요.")
        @Pattern(regexp = "USED|LOOKED", message = "써 봤는지 여부가 올바르지 않아요.") String path,
        @Min(value = 1, message = "만족도는 1에서 5 사이여야 해요.")
        @Max(value = 5, message = "만족도는 1에서 5 사이여야 해요.") Integer satisfaction,
        @Min(value = 0, message = "추천 점수는 0에서 10 사이여야 해요.")
        @Max(value = 10, message = "추천 점수는 0에서 10 사이여야 해요.") Integer nps,
        @Size(max = 10, message = "고른 답이 너무 많아요.") List<@Choice String> best,
        @Size(max = 10, message = "고른 답이 너무 많아요.") List<@Choice String> pain,
        @Size(max = 10, message = "고른 답이 너무 많아요.") List<@Choice String> whyNot,
        @Size(max = 10, message = "고른 답이 너무 많아요.") List<@Choice String> wouldHelp,
        @Size(max = 300, message = "한마디는 300자 이내로 적어 주세요.") String comment
) {
}
