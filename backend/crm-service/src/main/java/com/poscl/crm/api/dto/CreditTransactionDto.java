package com.poscl.crm.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditTransactionDto {
    private UUID id;
    private UUID customerProfileId;
    private String customerName;
    private String type; // SALE_CREDIT, PAYMENT, ADJUSTMENT
    private BigDecimal amount;
    private UUID referenceSaleId;
    private String referencePaymentId;
    private String description;
    private LocalDateTime createdAt;
}
