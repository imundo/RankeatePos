package com.poscl.sales.application.service;

import com.poscl.sales.api.dto.ProductPerformanceDto;
import com.poscl.sales.api.dto.SalesTrendDto;
import com.poscl.sales.domain.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportingServiceImpl implements ReportingService {

    private final SaleRepository saleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SalesTrendDto> getSalesTrend(LocalDateTime startDate, LocalDateTime endDate, String tenantId) {
        Instant start = startDate.atZone(ZoneId.systemDefault()).toInstant();
        Instant end = endDate.atZone(ZoneId.systemDefault()).toInstant();
        UUID tenantUuid = UUID.fromString(tenantId);

        List<Object[]> salesData = saleRepository.findSalesDataForTrend(tenantUuid, start, end);

        Map<String, SalesTrendDto> grouped = new TreeMap<>();
        // Use TreeMap to keep dates sorted

        for (Object[] row : salesData) {
            Instant createdAt = (Instant) row[0];
            Integer total = (Integer) row[1];

            LocalDate date = createdAt.atZone(ZoneId.systemDefault()).toLocalDate();
            String key = date.format(DateTimeFormatter.ISO_LOCAL_DATE);

            grouped.compute(key, (k, v) -> {
                if (v == null) {
                    return SalesTrendDto.builder()
                            .period(k)
                            .totalSales(BigDecimal.valueOf(total))
                            .transactionCount(1L)
                            .build();
                } else {
                    v.setTotalSales(v.getTotalSales().add(BigDecimal.valueOf(total)));
                    v.setTransactionCount(v.getTransactionCount() + 1);
                    return v;
                }
            });
        }

        // Fill missing dates if needed (optional), for now just return present days
        return new ArrayList<>(grouped.values());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductPerformanceDto> getTopProducts(LocalDateTime startDate, LocalDateTime endDate, String tenantId,
            int limit) {
        Instant start = startDate.atZone(ZoneId.systemDefault()).toInstant();
        Instant end = endDate.atZone(ZoneId.systemDefault()).toInstant();

        return saleRepository.findTopProducts(UUID.fromString(tenantId), start, end, PageRequest.of(0, limit));
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.poscl.sales.api.dto.CustomerMetricDto> getCustomerMetrics(LocalDateTime startDate,
            LocalDateTime endDate, String tenantId, int limit) {
        Instant start = startDate.atZone(ZoneId.systemDefault()).toInstant();
        Instant end = endDate.atZone(ZoneId.systemDefault()).toInstant();

        List<com.poscl.sales.api.dto.CustomerMetricDto> metrics = saleRepository.findCustomerMetrics(
                UUID.fromString(tenantId),
                start,
                end,
                PageRequest.of(0, limit));

        // Calculate Average Ticket manually
        metrics.forEach(m -> {
            if (m.getTransactionCount() > 0) {
                m.setAverageTicket(m.getTotalSpent().divide(BigDecimal.valueOf(m.getTransactionCount()),
                        java.math.RoundingMode.HALF_UP));
            } else {
                m.setAverageTicket(BigDecimal.ZERO);
            }
        });

        return metrics;
    }
}
