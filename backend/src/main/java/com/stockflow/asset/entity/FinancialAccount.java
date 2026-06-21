package com.stockflow.asset.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
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
public class FinancialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private String name;
    private String accountType;
    private String institutionName;
    private BigDecimal balance;
    private Boolean includedInAssets;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void update(String name, String accountType, String institutionName, BigDecimal balance, Boolean includedInAssets) {
        this.name = name;
        this.accountType = accountType;
        this.institutionName = institutionName;
        this.balance = balance;
        this.includedInAssets = includedInAssets;
        this.updatedAt = LocalDateTime.now();
    }
}
