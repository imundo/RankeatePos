package com.poscl.billing.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DteStatsDto {
    private long totalMes;
    private long aceptados;
    private long pendientes;
    private BigDecimal totalVentas;
    private BigDecimal totalVentasPendientes;
}
