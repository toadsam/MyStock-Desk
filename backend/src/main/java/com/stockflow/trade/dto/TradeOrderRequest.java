package com.stockflow.trade.dto;

import com.stockflow.global.type.OrderMethod;
import com.stockflow.global.type.OrderType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TradeOrderRequest(
        @NotBlank String symbol,
        @NotNull OrderType orderType,
        @NotNull OrderMethod orderMethod,
        @NotNull @DecimalMin("1") BigDecimal orderPrice,
        @NotNull @Min(1) Integer quantity
) {
}
