package com.stockflow.survey.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 하나만 고르는 답: 40자 이내이고 '|' 와 줄바꿈이 없어야 한다.
 *
 * <p>{@link Choice} 와 달리 비어 있어도 된다. 이 질문들은 설문이 열린 뒤에 더해졌고, 그 전 화면을 띄워 둔 사람은 이 값을 보내지 않는다.
 */
@Size(max = 40, message = "고른 답이 너무 길어요.")
@Pattern(regexp = "[^|\r\n]*", message = "고른 답에 쓸 수 없는 글자가 있어요.")
@Constraint(validatedBy = {})
@Target({ElementType.TYPE_USE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SingleChoice {

    String message() default "고른 답이 올바르지 않아요.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
