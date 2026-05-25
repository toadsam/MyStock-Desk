package com.stockflow.trade.dto;

import com.stockflow.global.type.OrderType;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.trade.entity.TradeLedger;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TradeLedgerDto(
        Long id,
        Long orderId,
        StockDto stock,
        OrderType orderType,
        Integer quantity,
        BigDecimal executionPrice,
        BigDecimal grossAmount,
        BigDecimal fee,
        BigDecimal netCashAmount,
        BigDecimal realizedProfitLoss,
        BigDecimal cashBalance,
        BigDecimal totalAsset,
        LocalDateTime createdAt
) {
    public static TradeLedgerDto of(TradeLedger ledger, StockDto stock) {
        return new TradeLedgerDto(
                ledger.getId(),
                ledger.getOrderId(),
                stock,
                ledger.getOrderType(),
                ledger.getQuantity(),
                ledger.getExecutionPrice(),
                ledger.getGrossAmount(),
                ledger.getFee(),
                ledger.getNetCashAmount(),
                ledger.getRealizedProfitLoss(),
                ledger.getCashBalance(),
                ledger.getTotalAsset(),
                ledger.getCreatedAt()
        );
    }
}
