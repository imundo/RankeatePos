package com.poscl.operations.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PriceListItem Entity Tests")
class PriceListItemTest {

    @Test
    @DisplayName("Should return fixed price when set")
    void getPrecioFinal_FixedPrice_ReturnsFixedPrice() {
        PriceListItem item = PriceListItem.builder()
                .precio(new BigDecimal("8500"))
                .build();

        BigDecimal result = item.getPrecioFinal(new BigDecimal("10000"));

        assertThat(result).isEqualTo(new BigDecimal("8500"));
    }

    @Test
    @DisplayName("Should apply discount when no fixed price")
    void getPrecioFinal_Discount_AppliesDiscount() {
        PriceListItem item = PriceListItem.builder()
                .precio(BigDecimal.ZERO)
                .descuento(new BigDecimal("20"))
                .build();

        BigDecimal result = item.getPrecioFinal(new BigDecimal("10000"));

        // 10000 * 0.80 = 8000
        assertThat(result).isEqualByComparingTo(new BigDecimal("8000"));
    }

    @Test
    @DisplayName("Should respect minimum price when discount would go lower")
    void getPrecioFinal_DiscountWithMinimum_RespectsMinimum() {
        PriceListItem item = PriceListItem.builder()
                .precio(BigDecimal.ZERO)
                .descuento(new BigDecimal("50"))
                .precioMinimo(new BigDecimal("6000"))
                .build();

        BigDecimal result = item.getPrecioFinal(new BigDecimal("10000"));

        // 10000 * 0.50 = 5000, but minimum is 6000
        assertThat(result).isEqualTo(new BigDecimal("6000"));
    }

    @Test
    @DisplayName("Should return base price when no adjustments")
    void getPrecioFinal_NoAdjustments_ReturnsBase() {
        PriceListItem item = PriceListItem.builder()
                .precio(BigDecimal.ZERO)
                .build();

        BigDecimal result = item.getPrecioFinal(new BigDecimal("10000"));

        assertThat(result).isEqualTo(new BigDecimal("10000"));
    }
}
