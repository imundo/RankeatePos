package com.poscl.purchases.api.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePurchaseOrderRequest {
    private UUID supplierId;
    private String expectedDeliveryDate;
    private String notes;
    private List<CreatePurchaseOrderItemRequest> items;

    @Data
    public static class CreatePurchaseOrderItemRequest {
        private UUID productVariantId;
        private String productName;
        private String productSku;
        private Integer quantity;
        private java.math.BigDecimal unitCost;
    }
}
