package com.stockflow.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MemberProfileRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        String profileImageUrl
) {
}
