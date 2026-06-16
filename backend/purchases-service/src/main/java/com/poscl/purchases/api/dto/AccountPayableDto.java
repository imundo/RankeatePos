package com.poscl.purchases.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPayableDto {
    private UUID id;
    private UUID tenantId;
    private UUID supplierId;
    private String supplierName;
    private UUID purchaseOrderId;
    private Long orderNumber;
    private String documentNumber;
    private String documentType;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private BigDecimal amount;
    private BigDecimal balance;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    
    // For UI computation
    public Long getDaysLeft() {
        if (dueDate == null) return 0L;
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
    }
}
