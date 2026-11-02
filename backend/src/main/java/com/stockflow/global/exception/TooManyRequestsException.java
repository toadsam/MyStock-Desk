package com.stockflow.global.exception;

/** 같은 곳에서 너무 자주 시도했을 때. GlobalExceptionHandler 가 429 로 바꾼다. */
public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
