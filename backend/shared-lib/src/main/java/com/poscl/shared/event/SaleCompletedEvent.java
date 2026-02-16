package com.poscl.shared.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleCompletedEvent {
    private UUID saleId;
    private UUID tenantId;
    private UUID customerId;
    private BigDecimal totalAmount;
    private Instant timestamp;
    private List<SaleItemEventDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemEventDto {
        private UUID productId; // or variantId
        private String productSku;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal total;
    }
}
