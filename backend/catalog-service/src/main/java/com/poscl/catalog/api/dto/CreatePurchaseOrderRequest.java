package com.poscl.catalog.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseOrderRequest {
    private UUID supplierId;
    private Instant expectedDeliveryDate;
    private String notes;
    private List<CreatePurchaseOrderItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePurchaseOrderItemRequest {
        private UUID productVariantId;
        private Integer quantity;
        private Integer unitCost;
    }
}
