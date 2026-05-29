package com.stockflow.disclosure.service;

import com.stockflow.disclosure.dto.DisclosureDto;
import com.stockflow.disclosure.provider.SecDisclosureProvider;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class DisclosureService {

    private final SecDisclosureProvider secDisclosureProvider;

    @Value("${stockflow.sec.default-symbols:NVDA,AAPL,MSFT,TSLA,AMD}")
    private String defaultSymbols;

    public List<DisclosureDto> getSecDisclosures(String symbols, Integer limit) {
        int cappedLimit = Math.max(1, Math.min(limit == null ? 12 : limit, 40));
        List<String> requestedSymbols = parseSymbols(StringUtils.hasText(symbols) ? symbols : defaultSymbols);
        if (requestedSymbols.isEmpty()) {
            return List.of();
        }
        int perSymbolLimit = Math.max(2, Math.min(8, cappedLimit));
        return secDisclosureProvider.fetchRecent(requestedSymbols, perSymbolLimit).stream()
                .limit(cappedLimit)
                .toList();
    }

    private List<String> parseSymbols(String symbols) {
        if (!StringUtils.hasText(symbols)) {
            return List.of();
        }
        return Arrays.stream(symbols.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toUpperCase)
                .distinct()
                .limit(12)
                .toList();
    }
}
