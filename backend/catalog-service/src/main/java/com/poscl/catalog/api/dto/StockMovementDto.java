package com.poscl.catalog.api.dto;

import com.poscl.catalog.domain.entity.StockMovement.TipoMovimiento;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de Movimiento de Stock
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDto {
    private UUID id;
    private UUID variantId;
    private String variantSku;
    private String productName;
    private UUID branchId;
    private TipoMovimiento tipo;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private Integer costoUnitario;
    private String motivo;
    private String documentoReferencia;
    private UUID createdBy;
    private Instant createdAt;
}
