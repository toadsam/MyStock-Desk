package com.stockflow.memo.entity;

import com.stockflow.global.type.MemoType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentMemo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private String symbol;

    @Enumerated(EnumType.STRING)
    private MemoType memoType;

    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String checklist;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void update(String symbol, MemoType memoType, String title, String content, String checklist) {
        this.symbol = symbol;
        this.memoType = memoType;
        this.title = title;
        this.content = content;
        this.checklist = checklist;
        this.updatedAt = LocalDateTime.now();
    }
}
