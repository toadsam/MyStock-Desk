package com.stockflow.global.persistence;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.YearMonth;

/**
 * YearMonth 를 "2026-10" 문자열로 저장한다.
 *
 * <p>Hibernate 는 YearMonth 를 따로 알지 못해서, 변환기가 없으면 자바 객체를 직렬화한
 * varbinary 로 넣는다. 앱은 그래도 돌아가지만 DB 에서 {@code WHERE budget_month = '2026-10'}
 * 처럼 달로 조회할 수 없다.
 */
@Converter(autoApply = true)
public class YearMonthConverter implements AttributeConverter<YearMonth, String> {

    @Override
    public String convertToDatabaseColumn(YearMonth value) {
        return value == null ? null : value.toString();
    }

    @Override
    public YearMonth convertToEntityAttribute(String value) {
        return value == null || value.isBlank() ? null : YearMonth.parse(value.trim());
    }
}
