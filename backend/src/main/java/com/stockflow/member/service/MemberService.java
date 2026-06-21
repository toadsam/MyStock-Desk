package com.stockflow.member.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.dto.MemberMembershipRequest;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final CurrentMemberProvider currentMemberProvider;

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
}
