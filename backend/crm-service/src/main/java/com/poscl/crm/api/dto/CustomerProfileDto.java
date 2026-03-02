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
public class CustomerProfileDto {
    private UUID id;
    private UUID tenantId;
    private String fullName;
    private String rut;
    private String email;
    private String phone;
    
    // Credit / Fiado
    private BigDecimal creditLimit;
    private BigDecimal currentDebt;
    private BigDecimal availableCredit;
    
    // RFM Stats
    private LocalDateTime lastPurchaseDate;
    private Integer purchaseCount;
    private BigDecimal totalLTV;
    
    // Segmentación
    private String segment; // VIP, CHURN_RISK, NEW etc. (calculado en backend)
}
