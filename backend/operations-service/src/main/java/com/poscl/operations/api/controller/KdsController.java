package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.KdsService;
import com.poscl.operations.domain.entity.KitchenOrder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/kds")
@RequiredArgsConstructor
@Tag(name = "KDS", description = "Kitchen Display System - Gestión de órdenes de cocina")
public class KdsController {

    private final KdsService kdsService;

    @GetMapping("/orders")
    @Operation(summary = "Obtener órdenes activas de cocina")
    public ResponseEntity<List<KitchenOrder>> getActiveOrders(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) UUID branchId) {
        
        // Use tenantId as branchId if not provided
        UUID effectiveBranchId = branchId != null ? branchId : tenantId;
        return ResponseEntity.ok(kdsService.getActiveOrders(tenantId, effectiveBranchId));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Obtener orden por ID")
    public ResponseEntity<KitchenOrder> getOrder(@PathVariable UUID id) {
        return kdsService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Actualizar estado de orden")
    public ResponseEntity<KitchenOrder> updateOrderStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String newStatus = request.get("estado");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(kdsService.updateOrderStatus(id, newStatus));
    }

    @PutMapping("/orders/{orderId}/items/{itemId}/status")
    @Operation(summary = "Actualizar estado de ítem de orden")
    public ResponseEntity<?> updateItemStatus(
            @PathVariable UUID orderId,
            @PathVariable UUID itemId,
            @RequestBody Map<String, String> request) {
        
        String newStatus = request.get("estado");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(kdsService.updateItemStatus(orderId, itemId, newStatus));
    }

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de cocina")
    public ResponseEntity<KdsService.KdsStats> getStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) UUID branchId) {
        
        UUID effectiveBranchId = branchId != null ? branchId : tenantId;
        return ResponseEntity.ok(kdsService.getStats(tenantId, effectiveBranchId));
    }
}
