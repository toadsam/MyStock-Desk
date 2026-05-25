package com.stockflow.transaction.dto;

import java.util.List;

public record CsvImportResultDto(
        int importedCount,
        List<String> errors
) {
}
