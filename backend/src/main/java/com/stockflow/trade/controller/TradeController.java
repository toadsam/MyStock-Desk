package com.stockflow.trade.controller;

import com.stockflow.global.response.ApiResponse;
import com.stockflow.trade.dto.ExecutionDto;
import com.stockflow.trade.dto.TradeLedgerDto;
import com.stockflow.trade.dto.TradeOrderDto;
import com.stockflow.trade.dto.TradeOrderRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trades")
@Deprecated(since = "transaction-records")
public class TradeController {

    @PostMapping("/orders")
    public ApiResponse<TradeOrderDto> createOrder(@Valid @RequestBody TradeOrderRequest request) {
        return ApiResponse.fail("DEPRECATED_API", "실제 주문/가상 체결 API는 더 이상 사용하지 않습니다. /api/transactions에 거래 기록을 저장하세요.");
    }

    @GetMapping("/orders")
    public ApiResponse<List<TradeOrderDto>> orders() {
        return ApiResponse.success(List.of());
    }

    @GetMapping("/executions")
    public ApiResponse<List<ExecutionDto>> executions() {
        return ApiResponse.success(List.of());
    }

    @GetMapping("/ledger")
    public ApiResponse<List<TradeLedgerDto>> ledger() {
        return ApiResponse.success(List.of());
    }

    @PatchMapping("/orders/{orderId}/cancel")
    public ApiResponse<TradeOrderDto> cancel(@PathVariable Long orderId) {
        return ApiResponse.fail("DEPRECATED_API", "이전 거래 실행 API는 제공하지 않습니다. 저장한 거래 기록은 /api/transactions/{id}에서 삭제하세요.");
    }
}
