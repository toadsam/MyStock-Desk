package com.stockflow.watchlist.repository;

import com.stockflow.watchlist.entity.Watchlist;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    List<Watchlist> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    Optional<Watchlist> findByMemberIdAndStockId(Long memberId, Long stockId);

    void deleteByMemberIdAndStockId(Long memberId, Long stockId);
}
