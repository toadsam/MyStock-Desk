package com.stockflow.trade.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.trade.dto.ExecutionDto;
import com.stockflow.trade.dto.TradeLedgerDto;
import com.stockflow.trade.dto.TradeOrderDto;
import com.stockflow.trade.dto.TradeOrderRequest;
import com.stockflow.trade.service.TradeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    @PostMapping("/orders")
    public ApiResponse<TradeOrderDto> createOrder(@Valid @RequestBody TradeOrderRequest request) {
        return ApiResponse.success(tradeService.createOrder(request));
    }

    @GetMapping("/orders")
    public ApiResponse<List<TradeOrderDto>> orders() {
        return ApiResponse.success(tradeService.getOrders());
    }

    @GetMapping("/executions")
    public ApiResponse<List<ExecutionDto>> executions() {
        return ApiResponse.success(tradeService.getExecutions());
    }

    @GetMapping("/ledger")
    public ApiResponse<List<TradeLedgerDto>> ledger() {
        return ApiResponse.success(tradeService.getLedger());
    }

    @PatchMapping("/orders/{orderId}/cancel")
    public ApiResponse<TradeOrderDto> cancel(@PathVariable Long orderId) {
        return ApiResponse.success(tradeService.cancel(orderId));
    }
}
