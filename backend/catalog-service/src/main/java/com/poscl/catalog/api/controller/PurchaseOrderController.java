package com.poscl.catalog.api.controller;

import com.poscl.catalog.api.dto.CreatePurchaseOrderRequest;
import com.poscl.catalog.api.dto.PurchaseOrderDto;
import com.poscl.catalog.application.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "Purchase Order management")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    @Operation(summary = "Get purchase orders")
    public ResponseEntity<Page<PurchaseOrderDto>> getPurchaseOrders(
            @RequestHeader("X-Tenant-Id") String tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrders(tenantId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order")
    public ResponseEntity<PurchaseOrderDto> getPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrder(tenantId, id));
    }

    @PostMapping
    @Operation(summary = "Create purchase order")
    public ResponseEntity<PurchaseOrderDto> createPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody CreatePurchaseOrderRequest request) {
        return ResponseEntity.ok(purchaseOrderService.createPurchaseOrder(tenantId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete purchase order")
    public ResponseEntity<Void> deletePurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        purchaseOrderService.deletePurchaseOrder(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit purchase order")
    public ResponseEntity<PurchaseOrderDto> submitPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.submitPurchaseOrder(tenantId, id));
    }

    @PostMapping("/{id}/receive")
    @Operation(summary = "Receive purchase order")
    public ResponseEntity<PurchaseOrderDto> receivePurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.receivePurchaseOrder(tenantId, id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel purchase order")
    public ResponseEntity<PurchaseOrderDto> cancelPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.cancelPurchaseOrder(tenantId, id));
    }
}
