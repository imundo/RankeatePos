package com.poscl.catalog.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierProductDto {
    private UUID id;
    private UUID supplierId;
    private UUID productVariantId;
    private String productVariantName; // For display
    private String supplierSku;
    private Integer lastCost;
    private Instant updatedAt;
}
