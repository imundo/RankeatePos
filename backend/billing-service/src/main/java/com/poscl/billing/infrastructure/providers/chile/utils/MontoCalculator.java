package com.poscl.billing.infrastructure.providers.chile.utils;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Calculadora de montos para DTEs chilenos
 * IVA = 19% sobre neto
 */
@Slf4j
@Component
public class MontoCalculator {

    private static final BigDecimal IVA_RATE = new BigDecimal("0.19");
    private static final BigDecimal IVA_DIVISOR = new BigDecimal("1.19");

    /**
     * Calcula montos a partir de items con precios afectos a IVA
     *
     * @param items  Lista de items con cantidad y precio unitario
     * @param afecto true si items están afectos a IVA
     * @return Montos calculados (neto, IVA, total)
     */
    public DteMontos calcularDesdeItems(List<ItemMonto> items, boolean afecto) {
        BigDecimal subtotal = BigDecimal.ZERO;

        for (ItemMonto item : items) {
            BigDecimal lineTotal = item.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(item.getCantidad()))
                    .setScale(0, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);
        }

        if (afecto) {
            // Items con IVA incluido
            BigDecimal neto = subtotal.divide(IVA_DIVISOR, 0, RoundingMode.HALF_UP);
            BigDecimal iva = subtotal.subtract(neto);

            return new DteMontos(neto, iva, BigDecimal.ZERO, subtotal);
        } else {
            // Items exentos
            return new DteMontos(BigDecimal.ZERO, BigDecimal.ZERO, subtotal, subtotal);
        }
    }

    /**
     * Calcula IVA desde el total (precio incluye IVA)
     *
     * @param total Total con IVA incluido
     * @return Montos desglosados
     */
    public DteMontos calcularDesdeTotal(BigDecimal total) {
        BigDecimal neto = total.divide(IVA_DIVISOR, 0, RoundingMode.HALF_UP);
        BigDecimal iva = total.subtract(neto);

        return new DteMontos(neto, iva, BigDecimal.ZERO, total);
    }

    /**
     * Calcula total desde neto
     *
     * @param neto Monto neto (sin IVA)
     * @return Montos calculados
     */
    public DteMontos calcularDesdeNeto(BigDecimal neto) {
        BigDecimal iva = neto.multiply(IVA_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal total = neto.add(iva);

        return new DteMontos(neto, iva, BigDecimal.ZERO, total);
    }

    /**
     * Valida que los montos cuadren correctamente
     *
     * @param montos Montos a validar
     * @return true si neto + IVA + exento = total
     */
    public boolean validarMontos(DteMontos montos) {
        BigDecimal calculatedTotal = montos.getNeto()
                .add(montos.getIva())
                .add(montos.getExento());

        return calculatedTotal.compareTo(montos.getTotal()) == 0;
    }

    /**
     * Redondea monto según reglas SII (sin decimales)
     *
     * @param monto Monto a redondear
     * @return Monto redondeado
     */
    public BigDecimal redondear(BigDecimal monto) {
        return monto.setScale(0, RoundingMode.HALF_UP);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemMonto {
        private int cantidad;
        private BigDecimal precioUnitario;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DteMontos {
        private BigDecimal neto;
        private BigDecimal iva;
        private BigDecimal exento;
        private BigDecimal total;
    }
}
