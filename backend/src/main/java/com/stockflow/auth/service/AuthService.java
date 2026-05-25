package com.stockflow.auth.service;

import com.stockflow.auth.dto.AuthResponse;
import com.stockflow.auth.dto.LoginRequest;
import com.stockflow.auth.dto.RegisterRequest;
import com.stockflow.auth.security.JwtProvider;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.PortfolioRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PortfolioRepository portfolioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(request.password(), member.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return toAuthResponse(member);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        Member member = memberRepository.save(Member.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .profileImageUrl("https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=80")
                .membershipGrade("BASIC")
                .createdAt(LocalDateTime.now())
                .build());
        portfolioRepository.save(Portfolio.builder()
                .memberId(member.getId())
                .cash(BigDecimal.valueOf(100_000_000))
                .totalAsset(BigDecimal.valueOf(100_000_000))
                .totalPurchaseAmount(BigDecimal.ZERO)
                .totalEvaluationAmount(BigDecimal.ZERO)
                .totalProfitLoss(BigDecimal.ZERO)
                .totalReturnRate(BigDecimal.ZERO)
                .dailyProfitLoss(BigDecimal.ZERO)
                .dailyReturnRate(BigDecimal.ZERO)
                .build());
        return toAuthResponse(member);
    }

    private AuthResponse toAuthResponse(Member member) {
        return new AuthResponse(
                jwtProvider.createToken(member.getId(), member.getEmail()),
                "Bearer",
                MemberDto.from(member)
        );
    }
}
