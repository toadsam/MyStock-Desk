package com.stockflow.expense.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import java.math.BigDecimal;
import java.time.LocalDate;
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
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private String category;
    private String merchant;
    private BigDecimal amount;
    private LocalDate spentDate;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String memo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void update(String category, String merchant, BigDecimal amount, LocalDate spentDate, String memo) {
        this.category = category;
        this.merchant = merchant;
        this.amount = amount;
        this.spentDate = spentDate;
        this.memo = memo;
        this.updatedAt = LocalDateTime.now();
    }
}
