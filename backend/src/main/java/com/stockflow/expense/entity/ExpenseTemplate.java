package com.stockflow.expense.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 퀵버튼 하나. 자주 쓰는 소비를 한 번의 탭으로 기록하기 위한 틀이다.
 *
 * <p>사용자에게 만들라고 시키지 않는다. 같은 가게가 여러 번 쌓이면 앱이 먼저 제안한다.
 * 가입할 때 소비 패턴을 길게 물으면 거기서 이탈하고, 사람들이 말하는 패턴은
 * 실제 소비와 거의 항상 다르기 때문이다.
 */
@Entity
@Table(name = "expense_template")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private String name;
    private String category;
    private String merchant;
    private BigDecimal amount;

    /** 버튼 정렬 기준. 많이 쓴 버튼이 앞에 온다. */
    private int usageCount;

    private LocalDateTime lastUsedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void update(String name, String category, String merchant, BigDecimal amount) {
        this.name = name;
        this.category = category;
        this.merchant = merchant;
        this.amount = amount;
        this.updatedAt = LocalDateTime.now();
    }

    public void markUsed() {
        this.usageCount = this.usageCount + 1;
        this.lastUsedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
