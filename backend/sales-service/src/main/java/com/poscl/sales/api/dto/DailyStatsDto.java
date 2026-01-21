package com.poscl.sales.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para estadísticas diarias de ventas
 * Usado en Dashboard y módulo de Ganancias Diarias
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyStatsDto {

    private LocalDate fecha;

    // Totales del día
    private BigDecimal totalVentas;
    private Integer totalTransacciones;
    private BigDecimal ticketPromedio;

    // Por estado
    private Integer ventasAprobadas;
    private Integer ventasPendientes;
    private Integer ventasRechazadas;
    private Integer ventasAnuladas;

    // Montos por estado
    private BigDecimal montoAprobado;
    private BigDecimal montoPendiente;
    private BigDecimal montoRechazado;

    // Top productos del día
    private List<TopProduct> topProductos;

    // Ventas por hora
    private List<HourlyStat> ventasPorHora;

    // Ventas por método de pago
    private List<PaymentMethodStat> ventasPorMetodoPago;

    // Ventas por sucursal
    private List<BranchStat> ventasPorSucursal;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProduct {
        private String nombre;
        private String sku;
        private Integer cantidad;
        private BigDecimal total;
        private String imagenUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyStat {
        private Integer hora;
        private String horaLabel; // "08:00", "09:00", etc.
        private Integer transacciones;
        private BigDecimal total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentMethodStat {
        private String metodoPago;
        private Integer transacciones;
        private BigDecimal total;
        private BigDecimal porcentaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BranchStat {
        private java.util.UUID sucursalId;
        private String sucursalNombre;
        private Integer transacciones;
        private BigDecimal ventas;
        private BigDecimal porcentaje;
    }
}
