package com.poscl.sales.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPerformanceDto {
    private String productName;
    private String sku;
    private BigDecimal totalQuantity;
    private BigDecimal totalRevenue;
}
