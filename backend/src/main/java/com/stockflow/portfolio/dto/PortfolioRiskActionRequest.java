package com.stockflow.portfolio.dto;

import jakarta.validation.constraints.NotBlank;

public record PortfolioRiskActionRequest(
        @NotBlank String action
) {
}
