package com.poscl.sales.api.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Response de sesión de caja
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashSessionDto {
    
    private UUID id;
    private UUID registerId;
    private String registerNombre;
    private UUID userId;
    
    private Integer montoInicial;
    private Integer montoFinal;
    private Integer montoTeorico;
    private Integer diferencia;
    
    private String estado;
    private Instant aperturaAt;
    private Instant cierreAt;
    private String cierreNota;
    
    // Resumen
    private Integer totalVentas;
    private Integer cantidadVentas;
    private Integer totalEfectivo;
    private Integer totalTarjeta;
    private Integer totalTransferencia;
}
