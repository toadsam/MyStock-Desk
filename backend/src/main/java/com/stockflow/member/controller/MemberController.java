package com.stockflow.member.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.dto.MemberMembershipRequest;
import com.stockflow.member.dto.MemberProfileRequest;
import com.stockflow.member.dto.PasswordChangeRequest;
import com.stockflow.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PatchMapping("/me/membership")
    public ApiResponse<MemberDto> updateMembership(@Valid @RequestBody MemberMembershipRequest request) {
        return ApiResponse.success(memberService.updateMembership(request));
    }

    @PatchMapping("/me/profile")
    public ApiResponse<MemberDto> updateProfile(@Valid @RequestBody MemberProfileRequest request) {
        return ApiResponse.success(memberService.updateProfile(request));
    }

    @PostMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        memberService.changePassword(request);
        return ApiResponse.success();
    }
}
