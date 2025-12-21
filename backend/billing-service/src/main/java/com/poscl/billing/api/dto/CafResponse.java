package com.poscl.billing.api.dto;

import com.poscl.billing.domain.enums.TipoDte;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Response con información del CAF (folios disponibles)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CafResponse {

    private UUID id;
    private TipoDte tipoDte;
    private String tipoDteDescripcion;
    
    private Integer folioDesde;
    private Integer folioHasta;
    private Integer folioActual;
    private Integer foliosDisponibles;
    private Double porcentajeUso;
    
    private LocalDate fechaAutorizacion;
    private LocalDate fechaVencimiento;
    private Boolean vencido;
    
    private Boolean activo;
    private Boolean agotado;
}
