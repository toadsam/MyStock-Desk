package com.stockflow.member.service;

import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    @Value("${stockflow.mock-member-id:1}")
    private Long mockMemberId;

    public MemberDto getCurrentMember() {
        return memberRepository.findById(mockMemberId)
                .map(MemberDto::from)
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
    }
}
