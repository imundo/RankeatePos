package com.poscl.inventory.api.dto;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockDto {
    private UUID id;
    private UUID variantId;
    private String variantSku;
    private String productName;
    private UUID branchId;
    private Integer cantidadActual;
    private Integer cantidadReservada;
    private Integer cantidadDisponible;
    private Integer stockMinimo;
    private boolean stockBajo;
    private Instant updatedAt;
}
