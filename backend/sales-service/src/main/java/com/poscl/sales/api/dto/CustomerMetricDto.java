package com.poscl.sales.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerMetricDto {
    private String customerId; // UUID as String
    private String customerName;
    private Instant lastPurchaseDate;
    private Long transactionCount; // Frequency
    private BigDecimal totalSpent; // Monetary
    private BigDecimal averageTicket;
}
