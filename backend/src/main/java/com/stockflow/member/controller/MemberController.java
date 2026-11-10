package com.stockflow.member.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.dto.MemberProfileRequest;
import com.stockflow.member.dto.PasswordChangeRequest;
import com.stockflow.member.service.MemberService;
import com.stockflow.member.service.MemberWithdrawalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final MemberWithdrawalService memberWithdrawalService;

    @GetMapping("/me")
    public ApiResponse<MemberDto> me() {
        return ApiResponse.success(memberService.getCurrentMember());
    }

    // 등급을 스스로 바꾸는 주소는 없앴다. 결제가 없는데 요청 한 번으로 VIP 가 되면 등급에 뜻이 없다.

    @PatchMapping("/me/profile")
    public ApiResponse<MemberDto> updateProfile(@Valid @RequestBody MemberProfileRequest request) {
        return ApiResponse.success(memberService.updateProfile(request));
    }

    @PostMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        memberService.changePassword(request);
        return ApiResponse.success();
    }

    /** 탈퇴. 회원과 그 회원의 기록을 전부 지운다. 되돌릴 수 없다. */
    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw() {
        memberWithdrawalService.withdrawCurrentMember();
        return ApiResponse.success();
    }
}
