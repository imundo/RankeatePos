package com.poscl.catalog.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItemDto {
    private UUID id;
    private UUID productVariantId;
    private String productVariantName;
    private String sku;
    private Integer quantity;
    private Integer unitCost;
    private Integer subtotal;
}
