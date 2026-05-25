package com.stockflow.watchlist.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import com.stockflow.watchlist.dto.WatchlistDto;
import com.stockflow.watchlist.dto.WatchlistMemoRequest;
import com.stockflow.watchlist.entity.Watchlist;
import com.stockflow.watchlist.repository.WatchlistRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final StockRepository stockRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public List<WatchlistDto> getWatchlist() {
        return watchlistRepository.findByMemberIdOrderByCreatedAtDesc(currentMemberProvider.currentMemberId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public WatchlistDto add(String symbol) {
        Long memberId = currentMemberProvider.currentMemberId();
        Stock stock = findStock(symbol);
        Watchlist watchlist = watchlistRepository.findByMemberIdAndStockId(memberId, stock.getId())
                .orElseGet(() -> watchlistRepository.save(Watchlist.builder()
                        .memberId(memberId)
                        .stockId(stock.getId())
                        .reason("관심 등록 이유를 적어두면 나중에 판단 기준을 복기하기 쉽습니다.")
                        .checkPoints("실적 발표 일정, 최근 뉴스, 내 보유 종목과의 연관성")
                        .priceMemo("관심 가격대 메모 없음")
                        .updatedAt(LocalDateTime.now())
                        .createdAt(LocalDateTime.now())
                        .build()));
        return toDto(watchlist);
    }

    @Transactional
    public WatchlistDto updateMemo(String symbol, WatchlistMemoRequest request) {
        Long memberId = currentMemberProvider.currentMemberId();
        Stock stock = findStock(symbol);
        Watchlist watchlist = watchlistRepository.findByMemberIdAndStockId(memberId, stock.getId())
                .orElseThrow(() -> new IllegalArgumentException("관심종목을 찾을 수 없습니다: " + symbol));
        watchlist.updateMemo(request.reason(), request.checkPoints(), request.priceMemo());
        return toDto(watchlist);
    }

    @Transactional
    public void delete(String symbol) {
        Stock stock = findStock(symbol);
        watchlistRepository.deleteByMemberIdAndStockId(currentMemberProvider.currentMemberId(), stock.getId());
    }

    private WatchlistDto toDto(Watchlist watchlist) {
        Stock stock = stockRepository.findById(watchlist.getStockId())
                .orElseThrow(() -> new IllegalArgumentException("관심종목 데이터를 찾을 수 없습니다."));
        return new WatchlistDto(
                watchlist.getId(),
                StockDto.from(stock),
                watchlist.getReason(),
                watchlist.getCheckPoints(),
                watchlist.getPriceMemo(),
                watchlist.getUpdatedAt(),
                watchlist.getCreatedAt()
        );
    }

    private Stock findStock(String symbol) {
        return stockRepository.findBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다: " + symbol));
    }
}
