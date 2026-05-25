package com.stockflow.transaction.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.global.type.TransactionType;
import com.stockflow.portfolio.entity.Holding;
import com.stockflow.portfolio.entity.Portfolio;
import com.stockflow.portfolio.repository.HoldingRepository;
import com.stockflow.portfolio.repository.PortfolioRepository;
import com.stockflow.portfolio.service.PortfolioSnapshotService;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import com.stockflow.transaction.dto.CsvImportResultDto;
import com.stockflow.transaction.dto.HoldingSummaryDto;
import com.stockflow.transaction.dto.InvestmentTransactionDto;
import com.stockflow.transaction.dto.RiskAlertDto;
import com.stockflow.transaction.dto.TransactionRequest;
import com.stockflow.transaction.dto.TransactionSummaryDto;
import com.stockflow.transaction.entity.InvestmentTransaction;
import com.stockflow.transaction.repository.InvestmentTransactionRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final BigDecimal RECORD_BASE_CASH = BigDecimal.valueOf(100_000_000L);

    private final InvestmentTransactionRepository transactionRepository;
    private final StockRepository stockRepository;
    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioSnapshotService portfolioSnapshotService;
    private final CurrentMemberProvider currentMemberProvider;

    public List<InvestmentTransactionDto> getTransactions() {
        return transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(currentMemberProvider.currentMemberId())
                .stream()
                .map(InvestmentTransactionDto::from)
                .toList();
    }

    public InvestmentTransactionDto getTransaction(Long id) {
        return InvestmentTransactionDto.from(findOwnedTransaction(id));
    }

    public TransactionSummaryDto getSummary() {
        Long memberId = currentMemberProvider.currentMemberId();
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        List<InvestmentTransaction> transactions = transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(memberId);
        long monthlyCount = transactions.stream()
                .filter(transaction -> !transaction.getTransactionDate().isBefore(monthStart))
                .count();
        BigDecimal buy = sum(transactions, TransactionType.BUY, false);
        BigDecimal sell = sum(transactions, TransactionType.SELL, false);
        BigDecimal profit = transactions.stream()
                .map(InvestmentTransaction::getRealizedProfitLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal fee = transactions.stream()
                .map(InvestmentTransaction::getFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new TransactionSummaryDto(monthlyCount, buy, sell, profit, fee);
    }

    @Transactional
    public InvestmentTransactionDto create(TransactionRequest request) {
        Long memberId = currentMemberProvider.currentMemberId();
        Stock stock = findStock(request.symbol(), request.stockName());
        Portfolio portfolio = findPortfolio(memberId);
        Integer quantity = normalizedQuantity(request);
        BigDecimal price = normalizedMoney(request.price());
        BigDecimal fee = normalizedMoney(request.fee());
        BigDecimal tax = normalizedMoney(request.tax());
        BigDecimal totalAmount = calculateTotalAmount(request.transactionType(), quantity, price);
        InvestmentTransaction saved = transactionRepository.save(InvestmentTransaction.builder()
                .memberId(memberId)
                .stockId(stock == null ? null : stock.getId())
                .symbol(resolveSymbol(stock, request.symbol(), request.transactionType()))
                .stockName(resolveStockName(stock, request.stockName(), request.transactionType()))
                .transactionType(request.transactionType())
                .quantity(quantity)
                .price(price)
                .fee(fee)
                .tax(tax)
                .totalAmount(totalAmount)
                .realizedProfitLoss(BigDecimal.ZERO)
                .transactionDate(request.transactionDate())
                .memo(request.memo())
                .reason(request.reason())
                .tags(joinTags(request.tags()))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        rebuildPortfolioFromTransactions(memberId);
        return InvestmentTransactionDto.from(transactionRepository.findById(saved.getId()).orElseThrow());
    }

    @Transactional
    public InvestmentTransactionDto update(Long id, TransactionRequest request) {
        InvestmentTransaction transaction = findOwnedTransaction(id);
        Stock stock = findStock(request.symbol(), request.stockName());
        Integer quantity = normalizedQuantity(request);
        BigDecimal price = normalizedMoney(request.price());
        BigDecimal fee = normalizedMoney(request.fee());
        BigDecimal tax = normalizedMoney(request.tax());
        BigDecimal totalAmount = calculateTotalAmount(request.transactionType(), quantity, price);
        transaction.update(
                stock == null ? null : stock.getId(),
                resolveSymbol(stock, request.symbol(), request.transactionType()),
                resolveStockName(stock, request.stockName(), request.transactionType()),
                request.transactionType(),
                quantity,
                price,
                fee,
                tax,
                totalAmount,
                transaction.getRealizedProfitLoss(),
                request.transactionDate(),
                request.memo(),
                request.reason(),
                joinTags(request.tags())
        );
        rebuildPortfolioFromTransactions(transaction.getMemberId());
        return InvestmentTransactionDto.from(transaction);
    }

    @Transactional
    public void delete(Long id) {
        InvestmentTransaction transaction = findOwnedTransaction(id);
        Long memberId = transaction.getMemberId();
        transactionRepository.delete(transaction);
        rebuildPortfolioFromTransactions(memberId);
    }

    public List<HoldingSummaryDto> getHoldingSummaries() {
        Portfolio portfolio = findPortfolio(currentMemberProvider.currentMemberId());
        portfolioSnapshotService.refresh(portfolio);
        BigDecimal totalAsset = portfolio.getTotalAsset();
        return holdingRepository.findByPortfolioIdOrderByWeightDesc(portfolio.getId()).stream()
                .map(holding -> toHoldingSummary(holding, totalAsset))
                .toList();
    }

    public HoldingSummaryDto getHoldingSummary(String symbol) {
        Portfolio portfolio = findPortfolio(currentMemberProvider.currentMemberId());
        portfolioSnapshotService.refresh(portfolio);
        Stock stock = stockRepository.findBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
        Holding holding = holdingRepository.findByPortfolioIdAndStockId(portfolio.getId(), stock.getId())
                .orElseThrow(() -> new IllegalArgumentException("보유 기록을 찾을 수 없습니다."));
        return toHoldingSummary(holding, portfolio.getTotalAsset());
    }

    public List<RiskAlertDto> getRiskAlerts() {
        List<HoldingSummaryDto> holdings = getHoldingSummaries();
        List<RiskAlertDto> alerts = new ArrayList<>();
        holdings.stream()
                .filter(holding -> holding.weight().compareTo(BigDecimal.valueOf(35)) >= 0)
                .forEach(holding -> alerts.add(new RiskAlertDto(
                        holding.stockName() + " 비중이 높습니다.",
                        holding.stockName() + " 비중이 " + holding.weight() + "%입니다. 추가 기록 전 종목 쏠림을 확인하세요.",
                        "HIGH"
                )));
        long lossCount = holdings.stream().filter(holding -> holding.profitLoss().compareTo(BigDecimal.ZERO) < 0).count();
        long profitCount = holdings.stream().filter(holding -> holding.profitLoss().compareTo(BigDecimal.ZERO) >= 0).count();
        alerts.add(new RiskAlertDto(
                "수익/손실 종목 현황",
                "손실 종목은 " + lossCount + "개, 수익 종목은 " + profitCount + "개입니다.",
                lossCount > profitCount ? "MEDIUM" : "LOW"
        ));
        List<InvestmentTransaction> recentBuys = transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(currentMemberProvider.currentMemberId())
                .stream()
                .filter(transaction -> transaction.getTransactionType() == TransactionType.BUY)
                .filter(transaction -> !transaction.getTransactionDate().isBefore(LocalDate.now().minusDays(30)))
                .toList();
        if (recentBuys.size() >= 3) {
            alerts.add(new RiskAlertDto(
                    "최근 30일 매수 기록 증가",
                    "최근 30일 동안 매수 기록이 " + recentBuys.size() + "건입니다. 특정 시점에 진입이 몰렸는지 확인하세요.",
                    "MEDIUM"
            ));
        }
        return alerts;
    }

    @Transactional
    public CsvImportResultDto importCsv(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        int imported = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int row = 0;
            while ((line = reader.readLine()) != null) {
                row++;
                if (row == 1 && line.toLowerCase().startsWith("date,")) {
                    continue;
                }
                if (line.isBlank()) {
                    continue;
                }
                try {
                    create(parseCsvRow(line));
                    imported++;
                } catch (Exception exception) {
                    errors.add(row + "행: " + exception.getMessage());
                }
            }
        } catch (Exception exception) {
            errors.add("CSV 파일을 읽지 못했습니다: " + exception.getMessage());
        }
        return new CsvImportResultDto(imported, errors);
    }

    private InvestmentTransaction findOwnedTransaction(Long id) {
        InvestmentTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("거래 기록을 찾을 수 없습니다."));
        if (!transaction.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 거래 기록입니다.");
        }
        return transaction;
    }

    private TransactionRequest parseCsvRow(String line) {
        String[] values = line.split(",", -1);
        if (values.length < 10) {
            throw new IllegalArgumentException("컬럼 수가 부족합니다.");
        }
        return new TransactionRequest(
                values[2].trim(),
                values[3].trim(),
                TransactionType.valueOf(values[1].trim().toUpperCase()),
                parseInt(values[4]),
                parseMoney(values[5]),
                parseMoney(values[6]),
                parseMoney(values[7]),
                LocalDate.parse(values[0].trim()),
                values[8].trim(),
                values[9].trim(),
                values.length > 10 ? Arrays.stream(values[10].split("\\|")).map(String::trim).toList() : List.of()
        );
    }

    private BigDecimal applyRecord(
            Portfolio portfolio,
            Stock stock,
            TransactionType type,
            Integer quantity,
            BigDecimal price,
            BigDecimal fee,
            BigDecimal tax,
            BigDecimal totalAmount
    ) {
        BigDecimal realizedProfitLoss = BigDecimal.ZERO;
        if (type == TransactionType.BUY) {
            requireStock(stock);
            portfolio.withdraw(totalAmount.add(fee).add(tax));
            Holding holding = holdingRepository.findByPortfolioIdAndStockId(portfolio.getId(), stock.getId())
                    .orElseGet(() -> holdingRepository.save(Holding.builder()
                            .portfolioId(portfolio.getId())
                            .stockId(stock.getId())
                            .quantity(0)
                            .averagePrice(BigDecimal.ZERO)
                            .currentPrice(stock.getCurrentPrice())
                            .evaluationAmount(BigDecimal.ZERO)
                            .profitLoss(BigDecimal.ZERO)
                            .returnRate(BigDecimal.ZERO)
                            .weight(BigDecimal.ZERO)
                            .build()));
            holding.buy(quantity, price);
        } else if (type == TransactionType.SELL) {
            requireStock(stock);
            Holding holding = holdingRepository.findByPortfolioIdAndStockId(portfolio.getId(), stock.getId())
                    .orElseThrow(() -> new IllegalArgumentException("매도 기록을 저장할 보유 종목이 없습니다."));
            realizedProfitLoss = price.subtract(holding.getAveragePrice())
                    .multiply(BigDecimal.valueOf(quantity))
                    .subtract(fee)
                    .subtract(tax)
                    .setScale(0, RoundingMode.HALF_UP);
            holding.sell(quantity);
            portfolio.deposit(totalAmount.subtract(fee).subtract(tax));
            if (holding.isEmpty()) {
                holdingRepository.delete(holding);
            }
        } else if (type == TransactionType.DIVIDEND || type == TransactionType.DEPOSIT) {
            portfolio.deposit(price.subtract(fee).subtract(tax));
        } else if (type == TransactionType.WITHDRAWAL) {
            portfolio.withdraw(price.add(fee).add(tax));
        }
        portfolioSnapshotService.refresh(portfolio);
        return realizedProfitLoss;
    }

    private void rebuildPortfolioFromTransactions(Long memberId) {
        Portfolio portfolio = findPortfolio(memberId);
        holdingRepository.deleteByPortfolioId(portfolio.getId());
        portfolio.resetForRecordRecalculation(RECORD_BASE_CASH);
        List<InvestmentTransaction> transactions = transactionRepository.findByMemberIdOrderByTransactionDateDescCreatedAtDesc(memberId).stream()
                .sorted(Comparator.comparing(InvestmentTransaction::getTransactionDate).thenComparing(InvestmentTransaction::getCreatedAt))
                .toList();

        for (InvestmentTransaction transaction : transactions) {
            Stock stock = transaction.getStockId() == null
                    ? findStock(transaction.getSymbol(), transaction.getStockName())
                    : stockRepository.findById(transaction.getStockId()).orElse(null);
            BigDecimal totalAmount = calculateTotalAmount(transaction.getTransactionType(), transaction.getQuantity(), transaction.getPrice());
            BigDecimal realizedProfitLoss = applyRecord(
                    portfolio,
                    stock,
                    transaction.getTransactionType(),
                    transaction.getQuantity(),
                    transaction.getPrice(),
                    transaction.getFee(),
                    transaction.getTax(),
                    totalAmount
            );
            transaction.updateCalculatedAmounts(totalAmount, realizedProfitLoss);
        }
        portfolioSnapshotService.refresh(portfolio);
    }

    private HoldingSummaryDto toHoldingSummary(Holding holding, BigDecimal totalAsset) {
        Stock stock = stockRepository.findById(holding.getStockId())
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
        BigDecimal realizedProfitLoss = transactionRepository
                .findByMemberIdAndSymbolOrderByTransactionDateDescCreatedAtDesc(currentMemberProvider.currentMemberId(), stock.getSymbol())
                .stream()
                .map(InvestmentTransaction::getRealizedProfitLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        holding.refresh(stock.getCurrentPrice(), totalAsset);
        return new HoldingSummaryDto(
                stock.getSymbol(),
                stock.getName(),
                holding.getQuantity(),
                holding.getAveragePrice(),
                holding.getCurrentPrice(),
                holding.getEvaluationAmount(),
                holding.getProfitLoss(),
                holding.getReturnRate(),
                realizedProfitLoss,
                holding.getWeight()
        );
    }

    private Stock findStock(String symbol, String stockName) {
        if (symbol != null && !symbol.isBlank()) {
            return stockRepository.findBySymbol(symbol.trim()).orElse(null);
        }
        if (stockName != null && !stockName.isBlank()) {
            return stockRepository.findAll().stream()
                    .filter(stock -> stock.getName().equals(stockName.trim()))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private Portfolio findPortfolio(Long memberId) {
        return portfolioRepository.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
    }

    private void requireStock(Stock stock) {
        if (stock == null) {
            throw new IllegalArgumentException("매수/매도 기록에는 종목코드 또는 종목명이 필요합니다.");
        }
    }

    private Integer normalizedQuantity(TransactionRequest request) {
        if (request.transactionType() == TransactionType.DIVIDEND
                || request.transactionType() == TransactionType.DEPOSIT
                || request.transactionType() == TransactionType.WITHDRAWAL) {
            return request.quantity() == null ? 0 : request.quantity();
        }
        if (request.quantity() == null || request.quantity() <= 0) {
            throw new IllegalArgumentException("매수/매도 기록에는 수량이 필요합니다.");
        }
        return request.quantity();
    }

    private BigDecimal calculateTotalAmount(TransactionType type, Integer quantity, BigDecimal price) {
        if (type == TransactionType.BUY || type == TransactionType.SELL) {
            return price.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP);
        }
        return price.setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal sum(List<InvestmentTransaction> transactions, TransactionType type, boolean includeFee) {
        return transactions.stream()
                .filter(transaction -> transaction.getTransactionType() == type)
                .map(transaction -> includeFee ? transaction.getTotalAmount().add(transaction.getFee()) : transaction.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String resolveSymbol(Stock stock, String requestedSymbol, TransactionType type) {
        if (stock != null) {
            return stock.getSymbol();
        }
        if (requestedSymbol != null && !requestedSymbol.isBlank()) {
            return requestedSymbol.trim();
        }
        return type.name();
    }

    private String resolveStockName(Stock stock, String requestedName, TransactionType type) {
        if (stock != null) {
            return stock.getName();
        }
        if (requestedName != null && !requestedName.isBlank()) {
            return requestedName.trim();
        }
        return switch (type) {
            case DEPOSIT -> "입금";
            case WITHDRAWAL -> "출금";
            case DIVIDEND -> "배당";
            default -> "직접 입력";
        };
    }

    private String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return String.join(",", tags.stream().map(String::trim).filter(tag -> !tag.isBlank()).toList());
    }

    private BigDecimal normalizedMoney(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal parseMoney(String value) {
        return value == null || value.isBlank() ? BigDecimal.ZERO : new BigDecimal(value.trim());
    }

    private Integer parseInt(String value) {
        return value == null || value.isBlank() ? 0 : Integer.parseInt(value.trim());
    }
}
