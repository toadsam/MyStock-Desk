package com.stockflow.member.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.global.exception.ForbiddenException;
import com.stockflow.member.entity.Member;
import com.stockflow.member.repository.MemberRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 탈퇴. 회원과 그 회원이 남긴 기록을 전부 지운다.
 *
 * <p>지울 표를 손으로 적어 두면 표가 하나 늘 때 빠뜨린다. 그래서 {@code memberId} 칸이 있는 표는 전부 찾아서 지운다.
 * 회원 번호가 아니라 부모 번호로 묶인 표(보유 종목, 체결)만 {@link #CHILD_DELETES} 에 따로 적는다.
 * 새 표가 어느 쪽에도 들지 않으면 MemberWithdrawalIntegrationTest 가 실패해서 알려 준다.
 *
 * <p>지운 뒤에는 그 회원의 토큰도 통하지 않는다(TokenRevocationService 는 없는 회원의 토큰을 받지 않는다).
 */
@Service
@RequiredArgsConstructor
public class MemberWithdrawalService {

    /** 회원 번호 칸 이름. 이 칸이 있는 표는 탈퇴할 때 그 회원의 줄이 전부 지워진다. */
    public static final String MEMBER_COLUMN = "memberId";

    /** 부모를 지우기 전에 먼저 지워야 하는 표. 부모가 사라지면 이 줄들을 찾을 길이 없다. */
    static final List<String> CHILD_DELETES = List.of(
            "delete from Execution e where e.orderId in (select o.id from TradeOrder o where o.memberId = :memberId)",
            "delete from Holding h where h.portfolioId in (select p.id from Portfolio p where p.memberId = :memberId)"
    );

    private final MemberRepository memberRepository;
    private final CurrentMemberProvider currentMemberProvider;
    private final DemoAccountPolicy demoAccountPolicy;
    private final EntityManager entityManager;

    @Transactional
    public void withdrawCurrentMember() {
        Member member = memberRepository.findById(currentMemberProvider.currentMemberId())
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자를 찾을 수 없습니다."));
        if (demoAccountPolicy.isDemo(member)) {
            throw new ForbiddenException("데모 계정은 여럿이 같이 쓰는 계정이라 지울 수 없어요.");
        }
        Long memberId = member.getId();

        CHILD_DELETES.forEach(query -> entityManager.createQuery(query)
                .setParameter("memberId", memberId)
                .executeUpdate());
        for (EntityType<?> entity : entityManager.getMetamodel().getEntities()) {
            if (hasMemberColumn(entity)) {
                entityManager.createQuery("delete from " + entity.getName() + " x where x." + MEMBER_COLUMN + " = :memberId")
                        .setParameter("memberId", memberId)
                        .executeUpdate();
            }
        }
        memberRepository.delete(member);
    }

    static boolean hasMemberColumn(EntityType<?> entity) {
        return entity.getAttributes().stream().anyMatch(attribute -> MEMBER_COLUMN.equals(attribute.getName()));
    }
}
