package com.stockflow.transaction.dto;

import com.stockflow.global.type.TransactionType;
import com.stockflow.transaction.entity.InvestmentTransaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record InvestmentTransactionDto(
        Long id,
        String symbol,
        String stockName,
        TransactionType transactionType,
        Integer quantity,
        BigDecimal price,
        BigDecimal fee,
        BigDecimal tax,
        BigDecimal totalAmount,
        BigDecimal realizedProfitLoss,
        LocalDate transactionDate,
        String memo,
        String reason,
        List<String> tags,
        LocalDateTime createdAt
) {
    public static InvestmentTransactionDto from(InvestmentTransaction transaction) {
        return new InvestmentTransactionDto(
                transaction.getId(),
                transaction.getSymbol(),
                transaction.getStockName(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getFee(),
                transaction.getTax(),
                transaction.getTotalAmount(),
                transaction.getRealizedProfitLoss(),
                transaction.getTransactionDate(),
                transaction.getMemo(),
                transaction.getReason(),
                parseTags(transaction.getTags()),
                transaction.getCreatedAt()
        );
    }

    private static List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .toList();
    }
}
