package com.stockflow.member.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/me")
    public ApiResponse<MemberDto> me() {
        return ApiResponse.success(memberService.getCurrentMember());
    }
}
