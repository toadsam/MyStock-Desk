package com.stockflow.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 비밀번호 상한 64자: BCrypt 는 72바이트까지만 보고, 더 긴 값은 인코더가 거부한다. */
public record RegisterRequest(
        @NotBlank @Size(max = 40, message = "이름은 40자 이내로 적어 주세요.") String name,
        @Email @NotBlank @Size(max = 120) String email,
        @NotBlank @Size(min = 8, max = 64, message = "비밀번호는 8자 이상 64자 이하여야 합니다.") String password
) {
}
