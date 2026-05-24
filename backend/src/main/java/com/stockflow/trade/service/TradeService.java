package com.stockflow.trade.service;

import com.stockflow.global.type.OrderMethod;
import com.stockflow.global.type.OrderStatus;
import com.stockflow.global.type.OrderType;
import com.stockflow.stock.dto.StockDto;
import com.stockflow.stock.entity.Stock;
import com.stockflow.stock.repository.StockRepository;
import com.stockflow.trade.dto.ExecutionDto;
import com.stockflow.trade.dto.TradeOrderDto;
import com.stockflow.trade.dto.TradeOrderRequest;
import com.stockflow.trade.entity.Execution;
import com.stockflow.trade.entity.TradeOrder;
import com.stockflow.trade.repository.ExecutionRepository;
import com.stockflow.trade.repository.TradeOrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TradeService {

    private static final BigDecimal FEE_RATE = new BigDecimal("0.00015");

    private final TradeOrderRepository tradeOrderRepository;
    private final ExecutionRepository executionRepository;
    private final StockRepository stockRepository;

    @Value("${stockflow.mock-member-id:1}")
    private Long mockMemberId;

    @Transactional
    public TradeOrderDto createOrder(TradeOrderRequest request) {
        Stock stock = stockRepository.findBySymbol(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다: " + request.symbol()));
        BigDecimal effectivePrice = request.orderMethod() == OrderMethod.MARKET
                ? stock.getCurrentPrice()
                : request.orderPrice();
        BigDecimal estimatedAmount = effectivePrice.multiply(BigDecimal.valueOf(request.quantity()));
        BigDecimal fee = estimatedAmount.multiply(FEE_RATE).setScale(0, RoundingMode.HALF_UP);
        OrderStatus status = shouldComplete(request, stock, effectivePrice)
                ? OrderStatus.COMPLETED
                : OrderStatus.PENDING;

        TradeOrder order = tradeOrderRepository.save(TradeOrder.builder()
                .memberId(mockMemberId)
                .stockId(stock.getId())
                .orderType(request.orderType())
                .orderMethod(request.orderMethod())
                .orderPrice(effectivePrice)
                .quantity(request.quantity())
                .estimatedAmount(estimatedAmount)
                .fee(fee)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build());

        if (status == OrderStatus.COMPLETED) {
            executionRepository.save(Execution.builder()
                    .orderId(order.getId())
                    .stockId(stock.getId())
                    .executionPrice(effectivePrice)
                    .quantity(request.quantity())
                    .executedAt(LocalDateTime.now())
                    .build());
        }

        return TradeOrderDto.of(order, StockDto.from(stock));
    }

    public List<TradeOrderDto> getOrders() {
        return tradeOrderRepository.findByMemberIdOrderByCreatedAtDesc(mockMemberId).stream()
                .map(this::toOrderDto)
                .toList();
    }

    public List<ExecutionDto> getExecutions() {
        Set<Long> memberOrderIds = tradeOrderRepository.findByMemberIdOrderByCreatedAtDesc(mockMemberId).stream()
                .map(TradeOrder::getId)
                .collect(Collectors.toSet());
        return executionRepository.findAllByOrderByExecutedAtDesc().stream()
                .filter(execution -> memberOrderIds.contains(execution.getOrderId()))
                .map(this::toExecutionDto)
                .toList();
    }

    @Transactional
    public TradeOrderDto cancel(Long orderId) {
        TradeOrder order = tradeOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getMemberId().equals(mockMemberId)) {
            throw new IllegalArgumentException("취소할 수 없는 주문입니다.");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("미체결 주문만 취소할 수 있습니다.");
        }
        order.cancel();
        return toOrderDto(order);
    }

    private boolean shouldComplete(TradeOrderRequest request, Stock stock, BigDecimal effectivePrice) {
        if (request.orderMethod() == OrderMethod.MARKET) {
            return true;
        }
        if (request.orderType() == OrderType.BUY) {
            return effectivePrice.compareTo(stock.getCurrentPrice()) >= 0;
        }
        return effectivePrice.compareTo(stock.getCurrentPrice()) <= 0;
    }

    private TradeOrderDto toOrderDto(TradeOrder order) {
        Stock stock = stockRepository.findById(order.getStockId())
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
        return TradeOrderDto.of(order, StockDto.from(stock));
    }

    private ExecutionDto toExecutionDto(Execution execution) {
        Stock stock = stockRepository.findById(execution.getStockId())
                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다."));
        return ExecutionDto.of(execution, StockDto.from(stock));
    }
}
