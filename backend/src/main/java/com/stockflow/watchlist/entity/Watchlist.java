package com.stockflow.watchlist.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;
    private Long stockId;
    private String reason;
    private String checkPoints;
    private String priceMemo;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;

    public void updateMemo(String reason, String checkPoints, String priceMemo) {
        this.reason = reason;
        this.checkPoints = checkPoints;
        this.priceMemo = priceMemo;
        this.updatedAt = LocalDateTime.now();
    }
}
