package com.poscl.catalog.api.dto;

import com.poscl.catalog.domain.entity.StockMovement.TipoMovimiento;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

/**
 * Request para ajuste de stock
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    @NotNull(message = "El ID de variante es obligatorio")
    private UUID variantId;

    @NotNull(message = "El ID de sucursal es obligatorio")
    private UUID branchId;

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private TipoMovimiento tipo;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;

    @Size(max = 500)
    private String motivo;

    @Size(max = 100)
    private String documentoReferencia;

    private Integer costoUnitario;
}
