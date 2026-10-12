package com.stockflow.global.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.YearMonth;
import org.junit.jupiter.api.Test;

class YearMonthConverterTest {

    private final YearMonthConverter converter = new YearMonthConverter();

    @Test
    void 달은_DB에_2026_10_같은_일곱_글자로_들어간다() {
        assertThat(converter.convertToDatabaseColumn(YearMonth.of(2026, 10))).isEqualTo("2026-10");
        assertThat(converter.convertToDatabaseColumn(YearMonth.of(2026, 3))).isEqualTo("2026-03");
    }

    @Test
    void DB의_글자를_다시_달로_읽는다() {
        assertThat(converter.convertToEntityAttribute("2026-10")).isEqualTo(YearMonth.of(2026, 10));
    }

    @Test
    void 비어_있으면_null_이다() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
        assertThat(converter.convertToEntityAttribute(" ")).isNull();
    }
}
