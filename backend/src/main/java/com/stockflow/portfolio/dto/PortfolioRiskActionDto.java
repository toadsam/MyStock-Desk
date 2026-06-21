package com.stockflow.portfolio.dto;

import com.stockflow.portfolio.entity.PortfolioRiskAction;
import java.time.LocalDateTime;

public record PortfolioRiskActionDto(
        Long id,
        String action,
        String status,
        LocalDateTime createdAt
) {
    public static PortfolioRiskActionDto from(PortfolioRiskAction action) {
        return new PortfolioRiskActionDto(
                action.getId(),
                action.getAction(),
                action.getStatus(),
                action.getCreatedAt()
        );
    }
}
