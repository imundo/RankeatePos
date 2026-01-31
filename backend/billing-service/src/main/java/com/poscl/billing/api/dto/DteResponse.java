package com.poscl.billing.api.dto;

import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Response con los datos de un DTE emitido
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DteResponse {

    private UUID id;
    private TipoDte tipoDte;
    private String tipoDteDescripcion;
    private Integer folio;
    private LocalDate fechaEmision;

    // Emisor
    private String emisorRut;
    private String emisorRazonSocial;
    private String emisorGiro;
    private String emisorDireccion;
    private String emisorComuna;
    private String emisorLogoUrl;

    // Receptor
    private String receptorRut;
    private String receptorRazonSocial;
    private String receptorEmail;

    // Montos
    private BigDecimal montoNeto;
    private BigDecimal montoExento;
    private BigDecimal montoIva;
    private BigDecimal montoTotal;

    // Estado
    private EstadoDte estado;
    private String estadoDescripcion;
    private String trackId;
    private String glosaEstado;
    private Instant fechaEnvio;
    private Instant fechaRespuesta;

    // URLs
    private String pdfUrl;
    private String xmlUrl;

    // Detalle
    private List<DetalleDto> detalles;

    // Referencias
    private UUID ventaId;
    private UUID dteReferenciaId;

    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetalleDto {
        private Integer numeroLinea;
        private String codigo;
        private String nombreItem;
        private String descripcionItem;
        private BigDecimal cantidad;
        private String unidadMedida;
        private BigDecimal precioUnitario;
        private BigDecimal descuentoPorcentaje;
        private BigDecimal descuentoMonto;
        private BigDecimal montoItem;
        private Boolean exento;
        private UUID productoId;
    }
}
