package com.poscl.billing.api.dto;

import com.poscl.billing.domain.enums.TipoDte;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Request para emitir un DTE (boleta, factura, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmitirDteRequest {

    @NotNull(message = "El tipo de DTE es requerido")
    private TipoDte tipoDte;

    // --- Fecha emisión ---
    private java.time.LocalDate fechaEmision;

    // --- Montos ---
    private BigDecimal neto;
    private BigDecimal iva;
    private BigDecimal exento;
    private BigDecimal total;

    // --- Receptor (opcional para boletas) ---
    @Size(max = 12, message = "RUT del receptor no puede exceder 12 caracteres")
    private String receptorRut;

    @Size(max = 100, message = "Razón social del receptor no puede exceder 100 caracteres")
    private String receptorRazonSocial;

    @Size(max = 80, message = "Giro del receptor no puede exceder 80 caracteres")
    private String receptorGiro;

    @Size(max = 70, message = "Dirección del receptor no puede exceder 70 caracteres")
    private String receptorDireccion;

    @Size(max = 20, message = "Comuna del receptor no puede exceder 20 caracteres")
    private String receptorComuna;

    @Size(max = 20, message = "Ciudad del receptor no puede exceder 20 caracteres")
    private String receptorCiudad;

    @Email(message = "Email del receptor debe ser válido")
    @Size(max = 80)
    private String receptorEmail;

    // --- Detalle de items ---
    @NotEmpty(message = "Debe incluir al menos un item")
    @Valid
    private List<ItemDto> items;

    // --- Referencia (para notas de crédito/débito) ---
    private UUID documentoReferencia;
    private UUID dteReferenciaId;

    @Size(max = 30)
    private String tipoReferencia;

    @Size(max = 90)
    private String razonReferencia;

    // --- Venta origen ---
    private UUID ventaId;

    // --- Opciones de envío ---
    @Builder.Default
    private Boolean enviarSii = true;

    @Builder.Default
    private Boolean enviarEmail = true;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto {

        @Size(max = 35)
        private String codigo;

        @NotBlank(message = "El nombre del item es requerido")
        @Size(max = 80, message = "Nombre del item no puede exceder 80 caracteres (Res. SII N°36)")
        private String nombreItem;

        private String nombre; // Alias for nombreItem

        @Size(max = 1000)
        private String descripcionItem;

        private String descripcion; // Alias for descripcionItem

        @NotNull(message = "La cantidad es requerida")
        @Positive(message = "La cantidad debe ser positiva")
        private Integer cantidad;

        private BigDecimal montoTotal;

        @Size(max = 4)
        private String unidadMedida;

        @NotNull(message = "El precio unitario es requerido")
        @PositiveOrZero(message = "El precio unitario no puede ser negativo")
        private BigDecimal precioUnitario;

        @Min(0)
        @Max(100)
        private BigDecimal descuentoPorcentaje;

        private BigDecimal descuentoMonto;

        private Boolean exento;

        private UUID productoId;
    }
}
