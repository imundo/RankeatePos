package com.poscl.purchases.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/purchase-orders")
public class PurchaseOrderController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPurchaseOrders(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String status) {
        
        List<Map<String, Object>> orders = new ArrayList<>();
        
        orders.add(createOrder(2045, "Distribuidora Nacional SpA", 3500000, "APPROVED", LocalDate.now()));
        orders.add(createOrder(2044, "Importadora del Pacífico Ltda", 1800000, "SENT", LocalDate.now().minusDays(2)));
        orders.add(createOrder(2043, "Comercial Norte Grande", 2200000, "RECEIVED", LocalDate.now().minusDays(5)));
        orders.add(createOrder(2042, "Alimentos Premium Chile", 950000, "DRAFT", LocalDate.now()));
        orders.add(createOrder(2041, "Tecnología y Servicios TI", 4500000, "PARTIAL", LocalDate.now().minusDays(10)));
        
        if (status != null && !status.isEmpty()) {
            orders = orders.stream()
                    .filter(o -> status.equalsIgnoreCase((String) o.get("status")))
                    .toList();
        }
        
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {
        
        Map<String, Object> order = createOrder(2045, "Distribuidora Nacional SpA", 3500000, "APPROVED", LocalDate.now());
        order.put("items", createOrderItems());
        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPurchaseOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> order = new HashMap<>(request);
        order.put("id", UUID.randomUUID().toString());
        order.put("orderNumber", new Random().nextInt(9000) + 1000);
        order.put("status", "DRAFT");
        order.put("createdAt", LocalDate.now().toString());
        
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveOrder(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {
        
        Map<String, Object> order = createOrder(2045, "Distribuidora Nacional SpA", 3500000, "APPROVED", LocalDate.now());
        order.put("approvedAt", LocalDate.now().toString());
        return ResponseEntity.ok(order);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", 45);
        summary.put("pendingOrders", 8);
        summary.put("totalAmount", 125000000);
        summary.put("pendingAmount", 15500000);
        summary.put("receivedThisMonth", 12);
        summary.put("avgDeliveryDays", 5.2);
        
        return ResponseEntity.ok(summary);
    }

    private Map<String, Object> createOrder(int number, String supplier, int total, String status, LocalDate date) {
        Map<String, Object> order = new HashMap<>();
        order.put("id", UUID.randomUUID().toString());
        order.put("orderNumber", number);
        order.put("supplierName", supplier);
        order.put("orderDate", date.toString());
        order.put("expectedDeliveryDate", date.plusDays(7).toString());
        order.put("subtotal", (int)(total / 1.19));
        order.put("taxAmount", (int)(total - total / 1.19));
        order.put("total", total);
        order.put("status", status);
        order.put("itemCount", new Random().nextInt(10) + 1);
        return order;
    }

    private List<Map<String, Object>> createOrderItems() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(createItem("SKU001", "Producto A", 50, 15000));
        items.add(createItem("SKU002", "Producto B", 30, 25000));
        items.add(createItem("SKU003", "Producto C", 100, 8000));
        return items;
    }

    private Map<String, Object> createItem(String sku, String name, int qty, int price) {
        Map<String, Object> item = new HashMap<>();
        item.put("productSku", sku);
        item.put("productName", name);
        item.put("quantity", qty);
        item.put("unitPrice", price);
        item.put("subtotal", qty * price);
        return item;
    }
}
