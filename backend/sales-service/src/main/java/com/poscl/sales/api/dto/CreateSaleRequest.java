package com.poscl.sales.api.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Request para crear venta (desde POS)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSaleRequest {

    // Idempotencia para offline sync
    @NotNull(message = "El commandId es obligatorio")
    private UUID commandId;

    // Session ID - optional, will auto-create if not valid UUID
    private String sessionId;

    // Cliente opcional
    private UUID customerId;
    private String customerNombre;

    // Items
    @NotEmpty(message = "Debe incluir al menos un item")
    private List<SaleItemRequest> items;

    // Pagos
    @NotEmpty(message = "Debe incluir al menos un pago")
    private List<SalePaymentRequest> payments;

    // Descuento global
    private Integer descuento;
    private BigDecimal descuentoPorcentaje;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemRequest {

        @NotNull(message = "El variantId es obligatorio")
        private UUID variantId;

        @NotBlank
        private String productSku;

        @NotBlank
        private String productNombre;

        @NotNull
        @DecimalMin(value = "0.001")
        private BigDecimal cantidad;

        @NotNull
        @Min(0)
        private Integer precioUnitario;

        private Integer descuento;
        private BigDecimal impuestoPorcentaje;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalePaymentRequest {

        @NotBlank
        private String medio; // EFECTIVO, DEBITO, CREDITO, TRANSFERENCIA

        @NotNull
        @Min(1)
        private Integer monto;

        private String referencia;
    }
}
