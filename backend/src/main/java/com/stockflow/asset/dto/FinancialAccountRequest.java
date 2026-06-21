package com.stockflow.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FinancialAccountRequest(
        @NotBlank String name,
        @NotBlank String accountType,
        @NotBlank String institutionName,
        @NotNull BigDecimal balance,
        Boolean includedInAssets
) {
}
