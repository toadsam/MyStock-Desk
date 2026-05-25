package com.stockflow.earnings.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.earnings.dart.DartFinancialSnapshot;
import com.stockflow.earnings.dart.OpenDartClient;
import com.stockflow.earnings.dto.EarningsCalendarDto;
import com.stockflow.earnings.dto.EarningsDto;
import com.stockflow.earnings.entity.Earnings;
import com.stockflow.earnings.repository.EarningsRepository;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.HoldingRepository;
import com.stockflow.portfolio.repository.PortfolioRepository;
import com.stockflow.stock.repository.StockRepository;
import com.stockflow.watchlist.repository.WatchlistRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EarningsService {

    private final EarningsRepository earningsRepository;
    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final WatchlistRepository watchlistRepository;
    private final StockRepository stockRepository;
    private final CurrentMemberProvider currentMemberProvider;
    private final OpenDartClient openDartClient;

    @Transactional
    public List<EarningsCalendarDto> getCalendar() {
        Long memberId = currentMemberProvider.currentMemberId();
        Set<String> holdingSymbols = holdingSymbols(memberId);
        Set<String> watchSymbols = watchSymbols(memberId);
        refreshActualFinancials(holdingSymbols);
        refreshActualFinancials(watchSymbols);
        return earningsRepository.findAllByOrderByAnnouncementDateAsc().stream()
                .map(earnings -> EarningsCalendarDto.of(earnings, relationType(earnings, holdingSymbols, watchSymbols)))
                .toList();
    }

    @Transactional
    public List<EarningsDto> getEarnings(String symbol) {
        stockRepository.findBySymbol(symbol).ifPresent(this::refreshActualFinancials);
        return earningsRepository.findBySymbolOrderByYearDescQuarterDesc(symbol).stream()
                .map(EarningsDto::from)
                .toList();
    }

    public List<EarningsDto> getFinancials(String symbol) {
        return getEarnings(symbol);
    }

    private void refreshActualFinancials(Set<String> symbols) {
        symbols.forEach(symbol -> stockRepository.findBySymbol(symbol).ifPresent(this::refreshActualFinancials));
    }

    private void refreshActualFinancials(com.stockflow.stock.entity.Stock stock) {
        Optional<DartFinancialSnapshot> snapshot = openDartClient.fetchLatestFinancials(stock);
        snapshot.ifPresent(this::upsertActualEarnings);
    }

    private void upsertActualEarnings(DartFinancialSnapshot snapshot) {
        Earnings earnings = earningsRepository.findBySymbolAndYearAndQuarter(
                        snapshot.symbol(),
                        snapshot.year(),
                        snapshot.quarter()
                )
                .orElseGet(() -> Earnings.builder()
                        .symbol(snapshot.symbol())
                        .companyName(snapshot.companyName())
                        .year(snapshot.year())
                        .quarter(snapshot.quarter())
                        .build());
        earnings.updateActualData(
                snapshot.revenue(),
                snapshot.operatingProfit(),
                snapshot.netIncome(),
                snapshot.operatingMargin(),
                snapshot.yoyRevenueGrowth(),
                snapshot.yoyOperatingProfitGrowth(),
                snapshot.announcementDate(),
                snapshot.source(),
                snapshot.lastUpdatedAt()
        );
        earningsRepository.save(earnings);
    }

    private Set<String> holdingSymbols(Long memberId) {
        return portfolioRepository.findByMemberId(memberId)
                .map(Portfolio::getId)
                .map(portfolioId -> holdingRepository.findByPortfolioIdOrderByWeightDesc(portfolioId).stream()
                        .map(holding -> stockRepository.findById(holding.getStockId())
                                .map(stock -> stock.getSymbol())
                                .orElse(null))
                        .filter(symbol -> symbol != null)
                        .collect(java.util.stream.Collectors.toCollection(HashSet::new)))
                .orElseGet(HashSet::new);
    }

    private Set<String> watchSymbols(Long memberId) {
        return watchlistRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(watchlist -> stockRepository.findById(watchlist.getStockId())
                        .map(stock -> stock.getSymbol())
                        .orElse(null))
                .filter(symbol -> symbol != null)
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));
    }

    private String relationType(Earnings earnings, Set<String> holdingSymbols, Set<String> watchSymbols) {
        if (holdingSymbols.contains(earnings.getSymbol())) {
            return "HOLDING";
        }
        if (watchSymbols.contains(earnings.getSymbol())) {
            return "WATCHLIST";
        }
        return "MARKET_REFERENCE";
    }
}
