package com.stockflow.stock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String symbol;

    @Column(nullable = false)
    private String name;

    private String market;
    private BigDecimal currentPrice;
    private BigDecimal previousClose;
    private BigDecimal changePrice;
    private BigDecimal changeRate;
    private BigDecimal highPrice;
    private BigDecimal lowPrice;
    private Long volume;
    private BigDecimal tradingValue;
    private String sector;
    private String industry;
    private BigDecimal marketCap;
    private BigDecimal per;
    private BigDecimal pbr;
    private BigDecimal dividendYield;
    private BigDecimal week52High;
    private BigDecimal week52Low;

    public void updateQuote(
            BigDecimal currentPrice,
            BigDecimal highPrice,
            BigDecimal lowPrice,
            Long volume,
            BigDecimal tradingValue
    ) {
        this.previousClose = this.currentPrice;
        this.currentPrice = currentPrice;
        this.changePrice = currentPrice.subtract(this.previousClose);
        if (this.previousClose.compareTo(BigDecimal.ZERO) == 0) {
            this.changeRate = BigDecimal.ZERO;
        } else {
            this.changeRate = this.changePrice
                    .multiply(BigDecimal.valueOf(100))
                    .divide(this.previousClose, 2, java.math.RoundingMode.HALF_UP);
        }
        this.highPrice = highPrice;
        this.lowPrice = lowPrice;
        this.volume = volume;
        this.tradingValue = tradingValue;
    }
}
