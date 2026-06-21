package com.stockflow.asset.dto;

import com.stockflow.asset.entity.FinancialAccount;
import java.math.BigDecimal;

public record FinancialAccountDto(
        Long id,
        String name,
        String accountType,
        String institutionName,
        BigDecimal balance,
        Boolean includedInAssets
) {
    public static FinancialAccountDto from(FinancialAccount account) {
        return new FinancialAccountDto(
                account.getId(),
                account.getName(),
                account.getAccountType(),
                account.getInstitutionName(),
                account.getBalance(),
                account.getIncludedInAssets()
        );
    }
}
