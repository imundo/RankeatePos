package com.poscl.sales.api.controller;

import com.poscl.sales.api.dto.*;
import com.poscl.sales.application.service.SaleService;
import com.poscl.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controlador de ventas POS
 */
@Slf4j
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Tag(name = "Ventas", description = "Gestión de ventas POS")
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    @Operation(summary = "Crear venta", description = "Crea una nueva venta (idempotente por commandId)")
    public ResponseEntity<SaleDto> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateSaleRequest request) {

        log.info("POST /api/sales - commandId: {}", request.getCommandId());
        SaleDto sale = saleService.createSale(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sale);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener venta", description = "Obtiene una venta por ID")
    public ResponseEntity<SaleDto> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(saleService.findById(tenantId, id));
    }

    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Ventas por sesión", description = "Lista ventas de una sesión de caja")
    public ResponseEntity<PageResponse<SaleDto>> findBySession(
            @PathVariable UUID sessionId,
            Pageable pageable) {

        Page<SaleDto> page = saleService.findBySession(sessionId, pageable);
        return ResponseEntity.ok(PageResponse.of(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Anular venta", description = "Anula una venta existente")
    public ResponseEntity<SaleDto> cancel(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestBody CancelSaleRequest request) {

        log.info("POST /api/sales/{}/cancel", id);
        SaleDto sale = saleService.cancelSale(tenantId, userId, id, request.getMotivo());
        return ResponseEntity.ok(sale);
    }

    // ====== ENDPOINTS PARA APROBACIÓN DE VENTAS ======

    @GetMapping("/pending")
    @Operation(summary = "Ventas pendientes", description = "Lista ventas pendientes de aprobación")
    public ResponseEntity<java.util.List<SaleDto>> getPendingSales(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        log.info("GET /api/sales/pending - TenantId: {}", tenantId);
        return ResponseEntity.ok(saleService.getPendingSales(tenantId));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprobar venta", description = "Aprueba una venta pendiente (suma a ganancias)")
    public ResponseEntity<SaleDto> approveSale(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id) {

        log.info("POST /api/sales/{}/approve - Aprobando venta", id);
        SaleDto sale = saleService.approveSale(tenantId, userId, id);
        return ResponseEntity.ok(sale);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Rechazar venta", description = "Rechaza una venta pendiente")
    public ResponseEntity<SaleDto> rejectSale(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestBody(required = false) RejectSaleRequest request) {

        log.info("POST /api/sales/{}/reject - Rechazando venta", id);
        String motivo = request != null ? request.getMotivo() : "Rechazada por supervisor";
        SaleDto sale = saleService.rejectSale(tenantId, userId, id, motivo);
        return ResponseEntity.ok(sale);
    }

    // ====== ENDPOINTS PARA DASHBOARD Y REPORTES ======

    @GetMapping("/stats/daily")
    @Operation(summary = "Estadísticas diarias", description = "Obtiene estadísticas de ventas del día")
    public ResponseEntity<DailyStatsDto> getDailyStats(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) String date) {

        log.info("GET /api/sales/stats/daily - TenantId: {}, date: {}", tenantId, date);
        // Use Chile timezone for default date (server runs in UTC)
        java.time.LocalDate targetDate = date != null
                ? java.time.LocalDate.parse(date)
                : java.time.LocalDate.now(java.time.ZoneId.of("America/Santiago"));
        return ResponseEntity.ok(saleService.getDailyStats(tenantId, targetDate));
    }

    @GetMapping("/stats/range")
    @Operation(summary = "Estadísticas por rango", description = "Obtiene estadísticas en un rango de fechas")
    public ResponseEntity<java.util.List<DailyStatsDto>> getStatsRange(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam String from,
            @RequestParam String to) {

        log.info("GET /api/sales/stats/range - TenantId: {}, from: {}, to: {}", tenantId, from, to);
        java.time.LocalDate fromDate = java.time.LocalDate.parse(from);
        java.time.LocalDate toDate = java.time.LocalDate.parse(to);
        return ResponseEntity.ok(saleService.getStatsRange(tenantId, fromDate, toDate));
    }

    @lombok.Data
    public static class CancelSaleRequest {
        private String motivo;
    }

    @lombok.Data
    public static class RejectSaleRequest {
        private String motivo;
    }
}
