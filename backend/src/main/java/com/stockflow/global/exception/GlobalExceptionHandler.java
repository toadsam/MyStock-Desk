package com.stockflow.global.exception;

import com.stockflow.global.response.ApiResponse;
import jakarta.validation.ConstraintViolation;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(this::describe)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR", message));
    }

    /**
     * 우리가 직접 적은 문장은 그대로 화면에 나가도 되니 문장만 보낸다.
     * 라이브러리 기본 문구("공백일 수 없습니다")는 어느 칸 얘기인지 알 수 없어서 칸 이름을 앞에 붙인다.
     */
    private String describe(FieldError error) {
        try {
            String template = error.unwrap(ConstraintViolation.class).getMessageTemplate();
            if (template != null && !template.startsWith("{")) {
                return error.getDefaultMessage();
            }
        } catch (IllegalArgumentException ignored) {
            // 제약 위반에서 온 오류가 아니다. 기본 형식으로 둔다.
        }
        return error.getField() + ": " + error.getDefaultMessage();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("BAD_REQUEST", exception.getMessage()));
    }

    @ExceptionHandler(ExternalDataException.class)
    public ResponseEntity<ApiResponse<Void>> handleExternalData(ExternalDataException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.fail(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthenticated(AuthenticationException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail("UNAUTHORIZED", "로그인이 필요합니다."));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("FORBIDDEN", exception.getMessage()));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooManyRequests(TooManyRequestsException exception) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.fail("TOO_MANY_REQUESTS", exception.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidJson(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("INVALID_JSON", "요청 본문 형식이 올바르지 않습니다."));
    }

    // 없는 주소와 안 받는 메서드는 서버 오류가 아니다. 따로 받지 않으면 맨 아래에서 500 이 된다.
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoResourceFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("NOT_FOUND", "없는 주소입니다."));
    }

    // 한도를 넘는 파일은 컨트롤러에 닿기 전에 걸린다. 따로 받지 않으면 이유 없는 500 으로 보인다.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooLargeUpload(MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.fail("FILE_TOO_LARGE", "사진이 너무 커요. 5MB 이하로 올려 주세요."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.fail("METHOD_NOT_ALLOWED", "이 주소에서 쓸 수 없는 요청 방식입니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("INTERNAL_SERVER_ERROR", "서버 처리 중 오류가 발생했습니다."));
    }
}
