package com.poscl.catalog.api.controller;

import com.poscl.catalog.api.dto.*;
import com.poscl.catalog.application.service.StockService;
import com.poscl.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador de Stock e Inventario
 */
@Slf4j
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Tag(name = "Inventario", description = "Gestión de stock y movimientos de inventario")
public class StockController {

    private final StockService stockService;

    @GetMapping
    @Operation(summary = "Listar stock", description = "Lista el stock de todos los productos en una sucursal")
    public ResponseEntity<List<StockDto>> getStockByBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam UUID branchId) {

        log.info("GET /api/stock - branchId={}", branchId);
        return ResponseEntity.ok(stockService.getStockByBranch(tenantId, branchId));
    }

    @GetMapping("/low")
    @Operation(summary = "Stock bajo", description = "Lista productos con stock bajo el mínimo")
    public ResponseEntity<List<StockDto>> getLowStock(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam UUID branchId) {

        return ResponseEntity.ok(stockService.getLowStock(tenantId, branchId));
    }

    @GetMapping("/low/count")
    @Operation(summary = "Contar stock bajo", description = "Cuenta productos con stock bajo")
    public ResponseEntity<Long> countLowStock(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        return ResponseEntity.ok(stockService.countLowStock(tenantId));
    }

    @GetMapping("/{variantId}")
    @Operation(summary = "Obtener stock", description = "Obtiene el stock de una variante en una sucursal")
    public ResponseEntity<StockDto> getStock(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID variantId,
            @RequestParam UUID branchId) {

        return ResponseEntity.ok(stockService.getStock(tenantId, variantId, branchId));
    }

    @PostMapping("/adjust")
    @Operation(summary = "Ajustar stock", description = "Registra entrada, salida o ajuste de inventario")
    public ResponseEntity<StockDto> adjustStock(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody StockAdjustmentRequest request) {

        log.info("POST /api/stock/adjust - tipo={}, cantidad={}",
                request.getTipo(), request.getCantidad());
        return ResponseEntity.ok(stockService.adjustStock(tenantId, userId, request));
    }

    @GetMapping("/movements")
    @Operation(summary = "Historial de movimientos", description = "Lista movimientos de stock de una sucursal")
    public ResponseEntity<PageResponse<StockMovementDto>> getMovements(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam UUID branchId,
            Pageable pageable) {

        Page<StockMovementDto> page = stockService.getMovements(tenantId, branchId, pageable);

        return ResponseEntity.ok(PageResponse.of(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()));
    }

    @GetMapping("/kardex/{variantId}")
    @Operation(summary = "Kardex", description = "Historial completo de movimientos de una variante")
    public ResponseEntity<List<StockMovementDto>> getKardex(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID variantId) {

        return ResponseEntity.ok(stockService.getKardex(variantId));
    }
}
