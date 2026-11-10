package com.stockflow.member.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.dto.MemberProfileRequest;
import com.stockflow.member.dto.PasswordChangeRequest;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final CurrentMemberProvider currentMemberProvider;
    private final PasswordEncoder passwordEncoder;
    private final DemoAccountPolicy demoAccountPolicy;

    public MemberDto getCurrentMember() {
        return memberRepository.findById(currentMemberProvider.currentMemberId())
                .map(MemberDto::from)
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public MemberDto updateProfile(MemberProfileRequest request) {
        Member member = memberRepository.findById(currentMemberProvider.currentMemberId())
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
        demoAccountPolicy.requireEditable(member);
        memberRepository.findByEmail(request.email())
                .filter(existing -> !existing.getId().equals(member.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
                });
        member.updateProfile(
                request.name(),
                request.email(),
                request.profileImageUrl() == null || request.profileImageUrl().isBlank()
                        ? member.getProfileImageUrl()
                        : request.profileImageUrl()
        );
        return MemberDto.from(member);
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        Member member = memberRepository.findById(currentMemberProvider.currentMemberId())
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
        demoAccountPolicy.requireEditable(member);
        if (!passwordEncoder.matches(request.currentPassword(), member.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }
        member.updatePasswordHash(passwordEncoder.encode(request.newPassword()));
        // 예전 비밀번호로 받아 둔 토큰은 여기서 끝난다. 화면은 저장 뒤 다시 로그인하게 한다.
        member.invalidateTokensIssuedBefore(Instant.now().getEpochSecond());
    }
}
