package com.stockflow.asset.repository;

import com.stockflow.asset.entity.FinancialAccount;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, Long> {
    List<FinancialAccount> findByMemberIdOrderByIdAsc(Long memberId);
}
