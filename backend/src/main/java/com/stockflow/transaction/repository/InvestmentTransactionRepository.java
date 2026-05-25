package com.stockflow.transaction.repository;

import com.stockflow.transaction.entity.InvestmentTransaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransaction, Long> {
    List<InvestmentTransaction> findByMemberIdOrderByTransactionDateDescCreatedAtDesc(Long memberId);

    List<InvestmentTransaction> findByMemberIdAndSymbolOrderByTransactionDateDescCreatedAtDesc(Long memberId, String symbol);
}
