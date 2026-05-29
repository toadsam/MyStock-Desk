package com.stockflow.global.exception;

import lombok.Getter;

@Getter
public class ExternalDataException extends RuntimeException {

    private final String code;

    public ExternalDataException(String code, String message) {
        super(message);
        this.code = code;
    }

    public ExternalDataException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}
