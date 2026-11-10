package com.stockflow.auth.repository;

import com.stockflow.auth.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {

    long deleteByExpiresAtLessThan(long epochSecond);
}
