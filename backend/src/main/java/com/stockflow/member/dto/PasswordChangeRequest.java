package com.stockflow.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
        @NotBlank @Size(max = 64) String currentPassword,
        @NotBlank @Size(min = 8, max = 64, message = "새 비밀번호는 8자 이상 64자 이하여야 합니다.") String newPassword
) {
}
