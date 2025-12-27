package com.poscl.purchases.api.controller;

import com.poscl.purchases.application.service.PurchaseOrderService;
import com.poscl.purchases.domain.entity.PurchaseOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService orderService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPurchaseOrders(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String status) {
        
        UUID tid = parseTenantId(tenantId);
        List<PurchaseOrder> orders;
        
        if (status != null && !status.isEmpty()) {
            try {
                PurchaseOrder.OrderStatus s = PurchaseOrder.OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.findByStatus(tid, s);
            } catch (IllegalArgumentException e) {
                orders = orderService.findAll(tid);
            }
        } else {
            orders = orderService.findAll(tid);
        }
        
        List<Map<String, Object>> result = orders.stream()
                .map(this::mapOrder)
                .toList();
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        
        UUID tid = parseTenantId(tenantId);
        return orderService.findById(tid, id)
                .map(o -> ResponseEntity.ok(mapOrder(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody PurchaseOrder order) {
        
        UUID tid = parseTenantId(tenantId);
        PurchaseOrder created = orderService.create(tid, order);
        return ResponseEntity.ok(mapOrder(created));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        
        UUID tid = parseTenantId(tenantId);
        PurchaseOrder approved = orderService.approve(tid, id);
        return ResponseEntity.ok(mapOrder(approved));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<?> sendOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        
        UUID tid = parseTenantId(tenantId);
        PurchaseOrder sent = orderService.send(tid, id);
        return ResponseEntity.ok(mapOrder(sent));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<?> receiveOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        
        UUID tid = parseTenantId(tenantId);
        PurchaseOrder received = orderService.receive(tid, id);
        return ResponseEntity.ok(mapOrder(received));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        UUID tid = parseTenantId(tenantId);
        Map<String, Object> summary = orderService.getSummary(tid);
        return ResponseEntity.ok(summary);
    }

    private UUID parseTenantId(String tenantId) {
        try {
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
    }

    private Map<String, Object> mapOrder(PurchaseOrder o) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", o.getId());
        map.put("orderNumber", o.getOrderNumber());
        map.put("supplierName", o.getSupplierName());
        map.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().toString() : null);
        map.put("subtotal", o.getSubtotal());
        map.put("tax", o.getTax());
        map.put("total", o.getTotal());
        map.put("status", o.getStatus());
        return map;
    }
}
