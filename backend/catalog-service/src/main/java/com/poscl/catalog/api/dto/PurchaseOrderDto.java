package com.poscl.catalog.api.dto;

import com.poscl.catalog.domain.enums.PurchaseOrderStatus;
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
public class PurchaseOrderDto {
    private UUID id;
    private Long orderNumber;
    private SupplierDto supplier;
    private PurchaseOrderStatus status;
    private Instant expectedDeliveryDate;
    private Integer totalAmount;
    private String notes;
    private List<PurchaseOrderItemDto> items;
    private Instant createdAt;
}
