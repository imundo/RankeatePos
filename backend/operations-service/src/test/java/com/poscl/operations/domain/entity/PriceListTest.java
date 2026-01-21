package com.poscl.operations.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PriceList Entity Tests")
class PriceListTest {

    @Test
    @DisplayName("GENERAL list should always be vigente when active")
    void isVigente_GeneralActive_ReturnsTrue() {
        PriceList list = PriceList.builder()
                .tipo(PriceList.TipoPrecio.GENERAL)
                .activa(true)
                .build();

        assertThat(list.isVigente(LocalDate.now())).isTrue();
    }

    @Test
    @DisplayName("Inactive list should not be vigente")
    void isVigente_Inactive_ReturnsFalse() {
        PriceList list = PriceList.builder()
                .tipo(PriceList.TipoPrecio.GENERAL)
                .activa(false)
                .build();

        assertThat(list.isVigente(LocalDate.now())).isFalse();
    }

    @Test
    @DisplayName("TEMPORAL list within date range should be vigente")
    void isVigente_TemporalWithinRange_ReturnsTrue() {
        LocalDate today = LocalDate.now();
        PriceList list = PriceList.builder()
                .tipo(PriceList.TipoPrecio.TEMPORAL)
                .activa(true)
                .fechaInicio(today.minusDays(5))
                .fechaFin(today.plusDays(5))
                .build();

        assertThat(list.isVigente(today)).isTrue();
    }

    @Test
    @DisplayName("TEMPORAL list before start date should not be vigente")
    void isVigente_TemporalBeforeStart_ReturnsFalse() {
        LocalDate today = LocalDate.now();
        PriceList list = PriceList.builder()
                .tipo(PriceList.TipoPrecio.TEMPORAL)
                .activa(true)
                .fechaInicio(today.plusDays(1))
                .fechaFin(today.plusDays(10))
                .build();

        assertThat(list.isVigente(today)).isFalse();
    }

    @Test
    @DisplayName("TEMPORAL list after end date should not be vigente")
    void isVigente_TemporalAfterEnd_ReturnsFalse() {
        LocalDate today = LocalDate.now();
        PriceList list = PriceList.builder()
                .tipo(PriceList.TipoPrecio.TEMPORAL)
                .activa(true)
                .fechaInicio(today.minusDays(10))
                .fechaFin(today.minusDays(1))
                .build();

        assertThat(list.isVigente(today)).isFalse();
    }
}
