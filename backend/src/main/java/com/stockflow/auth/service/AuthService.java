package com.stockflow.auth.service;

import com.stockflow.auth.dto.AuthConfigResponse;
import com.stockflow.auth.dto.AuthResponse;
import com.stockflow.auth.dto.LoginRequest;
import com.stockflow.auth.dto.RegisterRequest;
import com.stockflow.auth.google.GoogleIdTokenVerifier;
import com.stockflow.auth.google.GoogleIdentity;
import com.stockflow.auth.security.JwtProvider;
import com.stockflow.auth.security.LoginAttemptLimiter;
import com.stockflow.auth.security.TokenRevocationService;
import com.stockflow.member.dto.MemberDto;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.PortfolioRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PortfolioRepository portfolioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final TokenRevocationService tokenRevocationService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String DEFAULT_PROFILE_IMAGE =
            "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=80";

    public AuthResponse login(LoginRequest request, String clientIp) {
        loginAttemptLimiter.checkAllowed(clientIp, request.email());
        Member member = memberRepository.findByEmail(request.email()).orElse(null);
        // 없는 이메일과 틀린 비밀번호를 같은 문장, 같은 실패 횟수로 다룬다. 어느 쪽인지 알려 주면 이메일을 골라낼 수 있다.
        if (member == null || !passwordEncoder.matches(request.password(), member.getPasswordHash())) {
            loginAttemptLimiter.recordFailure(clientIp, request.email());
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        loginAttemptLimiter.recordSuccess(clientIp, request.email());
        return toAuthResponse(member);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        Member member = createMember(Member.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .profileImageUrl(DEFAULT_PROFILE_IMAGE));
        return toAuthResponse(member);
    }

    public AuthConfigResponse config() {
        return new AuthConfigResponse(googleIdTokenVerifier.clientId());
    }

    /**
     * 구글 계정으로 들어온다. 처음이면 그 자리에서 가입시킨다.
     *
     * <p>회원은 이메일이 아니라 구글 계정 번호(sub)로 찾는다. 같은 이메일로 이미 비밀번호 가입이 돼 있으면 합치지 않고 거절한다.
     * 이 서비스는 가입할 때 이메일 주인인지 확인하지 않는다. 그래서 자동으로 합치면, 남의 이메일로 먼저 가입해 둔 사람이
     * 나중에 진짜 주인이 구글로 들어와 쌓은 기록을 자기 비밀번호로 들여다볼 수 있게 된다.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String credential) {
        GoogleIdentity identity = googleIdTokenVerifier.verify(credential);
        if (!identity.emailVerified()) {
            throw new IllegalArgumentException("구글에서 확인된 이메일이 아니에요. 다른 구글 계정으로 시도해 주세요.");
        }
        Member member = memberRepository.findByGoogleSubject(identity.subject())
                .orElseGet(() -> registerFromGoogle(identity));
        return toAuthResponse(member);
    }

    private Member registerFromGoogle(GoogleIdentity identity) {
        if (memberRepository.existsByEmail(identity.email())) {
            throw new IllegalArgumentException("이미 이메일과 비밀번호로 가입한 계정이에요. 비밀번호로 로그인해 주세요.");
        }
        String name = identity.name() == null || identity.name().isBlank()
                ? identity.email().substring(0, identity.email().indexOf('@') < 0 ? identity.email().length() : identity.email().indexOf('@'))
                : identity.name().trim();
        String picture = identity.pictureUrl() != null && identity.pictureUrl().startsWith("https://")
                && identity.pictureUrl().length() <= 500 ? identity.pictureUrl() : DEFAULT_PROFILE_IMAGE;
        return createMember(Member.builder()
                .name(name.length() > 40 ? name.substring(0, 40) : name)
                .email(identity.email())
                // 비밀번호가 없는 계정이다. 칸은 비울 수 없어서, 아무도 모르는 값의 해시를 넣어 비밀번호 로그인이 절대 맞지 않게 한다.
                .passwordHash(passwordEncoder.encode(unguessablePassword()))
                .profileImageUrl(picture)
                .googleSubject(identity.subject()));
    }

    /** 난수 32바이트(글자로 43자). BCrypt 가 받는 72바이트 안에 들어오고, 맞힐 수 없다. */
    private String unguessablePassword() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** 가입 경로가 달라도 새 회원이 받는 것은 같다: 기본 등급과 빈 포트폴리오. */
    private Member createMember(Member.MemberBuilder builder) {
        Member member = memberRepository.save(builder
                .membershipGrade("BASIC")
                .createdAt(LocalDateTime.now())
                .build());
        // 기록이 없으면 0 이다. 예수금과 총자산은 거래 기록(입금, 매매, 배당)에서만 생긴다.
        portfolioRepository.save(Portfolio.builder()
                .memberId(member.getId())
                .cash(BigDecimal.ZERO)
                .totalAsset(BigDecimal.ZERO)
                .totalPurchaseAmount(BigDecimal.ZERO)
                .totalEvaluationAmount(BigDecimal.ZERO)
                .totalProfitLoss(BigDecimal.ZERO)
                .totalReturnRate(BigDecimal.ZERO)
                .dailyProfitLoss(BigDecimal.ZERO)
                .dailyReturnRate(BigDecimal.ZERO)
                .build());
        return member;
    }

    /**
     * 지금 쓰던 토큰 한 장을 버린다. 헤더가 없거나 이미 못 쓰는 토큰이면 할 일이 없다.
     * 화면은 어느 쪽이든 로그인 정보를 지우므로 실패로 돌려주지 않는다.
     */
    public void logout(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
            return;
        }
        try {
            tokenRevocationService.revoke(jwtProvider.parse(authorizationHeader.substring(7)));
        } catch (IllegalArgumentException ignored) {
            // 만료됐거나 서명이 틀린 토큰이다. 버릴 것이 없다.
        }
    }

    private AuthResponse toAuthResponse(Member member) {
        return new AuthResponse(
                jwtProvider.createToken(member.getId(), member.getEmail()),
                "Bearer",
                MemberDto.from(member)
        );
    }
}
