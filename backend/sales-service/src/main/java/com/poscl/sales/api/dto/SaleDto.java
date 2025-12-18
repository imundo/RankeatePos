package com.poscl.sales.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response de venta
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleDto {
    
    private UUID id;
    private UUID commandId;
    private String numero;
    private UUID sessionId;
    
    private UUID customerId;
    private String customerNombre;
    
    private Integer subtotal;
    private Integer descuento;
    private BigDecimal descuentoPorcentaje;
    private Integer impuestos;
    private Integer total;
    
    private String estado;
    private Instant createdAt;
    private UUID createdBy;
    
    private Instant anuladaAt;
    private String anulacionMotivo;
    
    private List<SaleItemDto> items;
    private List<SalePaymentDto> payments;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemDto {
        private UUID id;
        private UUID variantId;
        private String productSku;
        private String productNombre;
        private BigDecimal cantidad;
        private Integer precioUnitario;
        private Integer descuento;
        private BigDecimal impuestoPorcentaje;
        private Integer impuestoMonto;
        private Integer subtotal;
        private Integer total;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalePaymentDto {
        private UUID id;
        private String medio;
        private Integer monto;
        private String referencia;
    }
}
