package com.poscl.sales.application.service;

import com.poscl.sales.api.dto.ProductPerformanceDto;
import com.poscl.sales.api.dto.SalesTrendDto;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportingService {
    List<SalesTrendDto> getSalesTrend(LocalDateTime startDate, LocalDateTime endDate, String tenantId);

    List<ProductPerformanceDto> getTopProducts(LocalDateTime startDate, LocalDateTime endDate, String tenantId,
            int limit);

    List<com.poscl.sales.api.dto.CustomerMetricDto> getCustomerMetrics(LocalDateTime startDate, LocalDateTime endDate,
            String tenantId, int limit);
}
