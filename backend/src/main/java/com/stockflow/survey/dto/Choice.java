package com.stockflow.survey.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** 고르는 답 하나: 비어 있지 않고, 40자 이내이고, 한 칸에 이어 붙일 때 쓰는 '|' 와 줄바꿈이 없어야 한다. */
@NotBlank(message = "빈 답이 섞여 있어요.")
@Size(max = 40, message = "고른 답이 너무 길어요.")
@Pattern(regexp = "[^|\r\n]*", message = "고른 답에 쓸 수 없는 글자가 있어요.")
@Constraint(validatedBy = {})
@Target({ElementType.TYPE_USE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface Choice {

    String message() default "고른 답이 올바르지 않아요.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
