package com.poscl.purchases.api.controller;

import com.poscl.purchases.application.service.SupplierService;
import com.poscl.purchases.domain.entity.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getSuppliers(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) Boolean active) {

        UUID tid = parseTenantId(tenantId);
        List<Supplier> suppliers = active != null && active
                ? supplierService.findActive(tid)
                : supplierService.findAll(tid);

        List<Map<String, Object>> result = suppliers.stream()
                .map(this::mapSupplier)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {

        UUID tid = parseTenantId(tenantId);
        return supplierService.findById(tid, id)
                .map(s -> ResponseEntity.ok(mapSupplier(s)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> body) {

        UUID tid = parseTenantId(tenantId);
        Supplier supplier = fromMap(body);
        Supplier created = supplierService.create(tid, supplier);
        return ResponseEntity.ok(mapSupplier(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        UUID tid = parseTenantId(tenantId);
        Supplier updated = fromMap(body);
        Supplier result = supplierService.update(tid, id, updated);
        return ResponseEntity.ok(mapSupplier(result));
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<?> updateRating(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        UUID tid = parseTenantId(tenantId);
        BigDecimal rating = new BigDecimal(body.get("rating").toString());
        Supplier result = supplierService.updateRating(tid, id, rating);
        return ResponseEntity.ok(mapSupplier(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {

        UUID tid = parseTenantId(tenantId);
        supplierService.deactivate(tid, id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader("X-Tenant-Id") String tenantId) {

        UUID tid = parseTenantId(tenantId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActive", supplierService.countActive(tid));
        stats.put("totalAll", supplierService.findAll(tid).size());
        stats.put("avgRating", supplierService.getAverageRating(tid));
        return ResponseEntity.ok(stats);
    }

    private UUID parseTenantId(String tenantId) {
        try {
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
    }

    private Supplier fromMap(Map<String, Object> body) {
        Supplier.SupplierBuilder builder = Supplier.builder()
                .rut(getStr(body, "rut"))
                .businessName(getStr(body, "businessName"))
                .fantasyName(getStr(body, "fantasyName"))
                .giro(getStr(body, "giro"))
                .address(getStr(body, "address"))
                .city(getStr(body, "city"))
                .phone(getStr(body, "phone"))
                .email(getStr(body, "email"))
                .website(getStr(body, "website"))
                .contactName(getStr(body, "contactName"))
                .notes(getStr(body, "notes"))
                .bankAccount(getStr(body, "bankAccount"))
                .bankName(getStr(body, "bankName"));

        if (body.get("paymentTerms") != null) {
            builder.paymentTerms(((Number) body.get("paymentTerms")).intValue());
        }
        if (body.get("discountPercentage") != null) {
            builder.discountPercentage(new BigDecimal(body.get("discountPercentage").toString()));
        }
        if (body.get("currency") != null) {
            builder.currency(body.get("currency").toString());
        }
        if (body.get("avgDeliveryDays") != null) {
            builder.avgDeliveryDays(((Number) body.get("avgDeliveryDays")).intValue());
        }
        if (body.get("trustRating") != null) {
            builder.trustRating(new BigDecimal(body.get("trustRating").toString()));
        }
        if (body.get("category") != null) {
            try { builder.category(Supplier.SupplierCategory.valueOf(body.get("category").toString())); } catch (Exception ignored) {}
        }
        if (body.get("deliveryType") != null) {
            try { builder.deliveryType(Supplier.DeliveryType.valueOf(body.get("deliveryType").toString())); } catch (Exception ignored) {}
        }
        if (body.get("status") != null) {
            try { builder.status(Supplier.SupplierStatus.valueOf(body.get("status").toString())); } catch (Exception ignored) {}
        }

        return builder.build();
    }

    private String getStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private Map<String, Object> mapSupplier(Supplier s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("rut", s.getRut());
        map.put("businessName", s.getBusinessName());
        map.put("name", s.getFantasyName() != null ? s.getFantasyName() : s.getBusinessName());
        map.put("fantasyName", s.getFantasyName());
        map.put("giro", s.getGiro());
        map.put("email", s.getEmail());
        map.put("phone", s.getPhone());
        map.put("website", s.getWebsite());
        map.put("address", s.getAddress());
        map.put("city", s.getCity());
        map.put("contactName", s.getContactName());
        map.put("paymentTerms", s.getPaymentTerms());
        map.put("discountPercentage", s.getDiscountPercentage());
        map.put("currency", s.getCurrency());
        map.put("bankAccount", s.getBankAccount());
        map.put("bankName", s.getBankName());
        map.put("category", s.getCategory());
        map.put("deliveryType", s.getDeliveryType());
        map.put("avgDeliveryDays", s.getAvgDeliveryDays());
        map.put("trustRating", s.getTrustRating());
        map.put("totalOrders", s.getTotalOrders());
        map.put("onTimeDeliveries", s.getOnTimeDeliveries());
        map.put("totalSpent", s.getTotalSpent());
        map.put("status", s.getStatus());
        map.put("notes", s.getNotes());
        map.put("isActive", s.getIsActive());
        map.put("createdAt", s.getCreatedAt());
        return map;
    }
}
