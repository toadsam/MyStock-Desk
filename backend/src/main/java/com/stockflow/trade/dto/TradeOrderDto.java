package com.stockflow.trade.dto;

import com.stockflow.global.type.OrderMethod;
import com.stockflow.global.type.OrderStatus;
import com.stockflow.global.type.OrderType;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.trade.entity.TradeOrder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TradeOrderDto(
        Long id,
        StockDto stock,
        OrderType orderType,
        OrderMethod orderMethod,
        BigDecimal orderPrice,
        Integer quantity,
        BigDecimal estimatedAmount,
        BigDecimal fee,
        OrderStatus status,
        LocalDateTime createdAt
) {
    public static TradeOrderDto of(TradeOrder order, StockDto stock) {
        return new TradeOrderDto(
                order.getId(),
                stock,
                order.getOrderType(),
                order.getOrderMethod(),
                order.getOrderPrice(),
                order.getQuantity(),
                order.getEstimatedAmount(),
                order.getFee(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }
}
