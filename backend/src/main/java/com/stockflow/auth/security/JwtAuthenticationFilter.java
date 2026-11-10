package com.stockflow.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.global.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final ObjectMapper objectMapper;
    private final TokenRevocationService tokenRevocationService;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, ObjectMapper objectMapper,
            TokenRevocationService tokenRevocationService) {
        this.jwtProvider = jwtProvider;
        this.tokenRevocationService = tokenRevocationService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            try {
                String token = bearerToken.substring(7);
                TokenClaims claims = jwtProvider.parse(token);
                // 서명이 맞아도 로그아웃했거나 비밀번호를 바꾸기 전의 토큰이면 받지 않는다.
                if (tokenRevocationService.isRevoked(claims)) {
                    throw new IllegalArgumentException("폐기된 토큰입니다.");
                }
                Long memberId = claims.memberId();
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(memberId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (IllegalArgumentException exception) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                objectMapper.writeValue(response.getWriter(), ApiResponse.fail("INVALID_TOKEN", "로그인이 만료되었거나 토큰이 올바르지 않습니다."));
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
