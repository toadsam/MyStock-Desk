package com.stockflow.auth.dto;

import com.stockflow.member.dto.MemberDto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        MemberDto member
) {
}
