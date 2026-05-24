package com.stockflow.trade.dto;

import com.stockflow.stock.dto.StockDto;
import com.stockflow.trade.entity.Execution;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExecutionDto(
        Long id,
        Long orderId,
        StockDto stock,
        BigDecimal executionPrice,
        Integer quantity,
        LocalDateTime executedAt
) {
    public static ExecutionDto of(Execution execution, StockDto stock) {
        return new ExecutionDto(
                execution.getId(),
                execution.getOrderId(),
                stock,
                execution.getExecutionPrice(),
                execution.getQuantity(),
                execution.getExecutedAt()
        );
    }
}
