package com.stockflow.asset.entity;

import com.stockflow.global.persistence.YearMonthConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.YearMonth;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    @Convert(converter = YearMonthConverter.class)
    @Column(length = 7)
    private YearMonth budgetMonth;
    private BigDecimal incomeAmount;
    private BigDecimal livingBudgetAmount;
    private BigDecimal fixedExpenseAmount;
    private BigDecimal plannedSavingAmount;
    private BigDecimal plannedInvestmentAmount;

    public void update(
            BigDecimal incomeAmount,
            BigDecimal livingBudgetAmount,
            BigDecimal fixedExpenseAmount,
            BigDecimal plannedSavingAmount,
            BigDecimal plannedInvestmentAmount
    ) {
        this.incomeAmount = incomeAmount;
        this.livingBudgetAmount = livingBudgetAmount;
        this.fixedExpenseAmount = fixedExpenseAmount;
        this.plannedSavingAmount = plannedSavingAmount;
        this.plannedInvestmentAmount = plannedInvestmentAmount;
    }
}
