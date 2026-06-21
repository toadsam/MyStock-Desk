package com.stockflow.member.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.dto.MemberMembershipRequest;
import com.stockflow.member.dto.MemberProfileRequest;
import com.stockflow.member.dto.PasswordChangeRequest;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
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

    public MemberDto getCurrentMember() {
        return memberRepository.findById(currentMemberProvider.currentMemberId())
                .map(MemberDto::from)
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public MemberDto updateMembership(MemberMembershipRequest request) {
        Member member = memberRepository.findById(currentMemberProvider.currentMemberId())
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
        member.updateMembershipGrade(request.membershipGrade());
        return MemberDto.from(member);
    }

    @Transactional
    public MemberDto updateProfile(MemberProfileRequest request) {
        Member member = memberRepository.findById(currentMemberProvider.currentMemberId())
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
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
        if (!passwordEncoder.matches(request.currentPassword(), member.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }
        member.updatePasswordHash(passwordEncoder.encode(request.newPassword()));
    }
}
