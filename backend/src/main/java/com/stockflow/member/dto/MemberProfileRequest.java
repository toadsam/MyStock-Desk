package com.stockflow.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemberProfileRequest(
        @NotBlank @Size(max = 40, message = "이름은 40자 이내로 적어 주세요.") String name,
        @Email @NotBlank @Size(max = 120) String email,
        @Size(max = 500) String profileImageUrl
) {
}
