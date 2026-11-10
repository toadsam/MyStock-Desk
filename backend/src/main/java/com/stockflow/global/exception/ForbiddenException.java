package com.stockflow.global.exception;

/** 로그인은 했지만 이 계정으로는 할 수 없는 일. 403 으로 나간다. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
