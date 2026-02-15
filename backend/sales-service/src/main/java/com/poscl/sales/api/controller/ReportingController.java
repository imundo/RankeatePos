package com.poscl.sales.api.controller;

import com.poscl.sales.api.dto.ProductPerformanceDto;
import com.poscl.sales.api.dto.SalesTrendDto;
import com.poscl.sales.application.service.ReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reportes", description = "Endpoints para analítica de ventas y productos")
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/sales/trend")
    @Operation(summary = "Obtener tendencia de ventas", description = "Ventas agrupadas por día en un rango de fechas")
    public ResponseEntity<List<SalesTrendDto>> getSalesTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        return ResponseEntity.ok(reportingService.getSalesTrend(startDate, endDate, tenantId));
    }

    @GetMapping("/products/top")
    @Operation(summary = "Obtener top productos", description = "Productos más vendidos en el periodo")
    public ResponseEntity<List<ProductPerformanceDto>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "5") int limit,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        return ResponseEntity.ok(reportingService.getTopProducts(startDate, endDate, tenantId, limit));
    }

    @GetMapping("/customers/metrics")
    public ResponseEntity<List<com.poscl.sales.api.dto.CustomerMetricDto>> getCustomerMetrics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "10") int limit,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        return ResponseEntity.ok(reportingService.getCustomerMetrics(startDate, endDate, tenantId, limit));
    }
}
