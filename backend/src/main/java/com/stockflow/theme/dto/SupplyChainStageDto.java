package com.stockflow.theme.dto;

import java.util.List;

public record SupplyChainStageDto(
        String id,
        String name,
        String description,
        String focus,
        List<String> stockSymbols
) {
}
