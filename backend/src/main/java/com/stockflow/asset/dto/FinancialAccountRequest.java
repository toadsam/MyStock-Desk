package com.stockflow.asset.dto;

import com.stockflow.global.validation.Limits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record FinancialAccountRequest(
        @NotBlank @Size(max = 40, message = "계좌 이름은 40자 이내로 적어 주세요.") String name,
        @NotBlank @Size(max = 30) String accountType,
        @NotBlank @Size(max = 40, message = "금융사 이름은 40자 이내로 적어 주세요.") String institutionName,
        @NotNull
        @DecimalMin(value = Limits.BALANCE_MIN, message = "잔액은 -1조 원 이상으로 입력해 주세요.")
        @DecimalMax(value = Limits.BALANCE_MAX, message = "잔액은 1조 원 이하로 입력해 주세요.") BigDecimal balance,
        Boolean includedInAssets
) {
}
