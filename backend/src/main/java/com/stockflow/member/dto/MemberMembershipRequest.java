package com.stockflow.member.dto;

import jakarta.validation.constraints.NotBlank;

public record MemberMembershipRequest(
        @NotBlank String membershipGrade
) {
}
