package com.stockflow.disclosure.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DisclosureDto(
        String id,
        String symbol,
        String companyName,
        String formType,
        String title,
        String summary,
        String source,
        String sourceUrl,
        LocalDate filingDate,
        LocalDate reportDate,
        LocalDateTime fetchedAt,
        String reliability,
        Boolean officialSource
) {
}
