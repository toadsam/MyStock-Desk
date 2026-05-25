package com.stockflow.memo.repository;

import com.stockflow.memo.entity.InvestmentMemo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentMemoRepository extends JpaRepository<InvestmentMemo, Long> {
    List<InvestmentMemo> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
