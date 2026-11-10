package com.stockflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 구글 버튼이 돌려준 ID 토큰(credential). 이름과 이메일은 받지 않는다. 토큰 안의 값만 믿는다. */
public record GoogleLoginRequest(
        @NotBlank @Size(max = 4096) String credential
) {
}
