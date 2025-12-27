package com.poscl.purchases.api.controller;

import com.poscl.purchases.application.service.SupplierService;
import com.poscl.purchases.domain.entity.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestBody Supplier supplier) {
        
        UUID tid = parseTenantId(tenantId);
        Supplier created = supplierService.create(tid, supplier);
        return ResponseEntity.ok(mapSupplier(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody Supplier supplier) {
        
        UUID tid = parseTenantId(tenantId);
        Supplier updated = supplierService.update(tid, id, supplier);
        return ResponseEntity.ok(mapSupplier(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        
        UUID tid = parseTenantId(tenantId);
        supplierService.deactivate(tid, id);
        return ResponseEntity.ok().build();
    }

    private UUID parseTenantId(String tenantId) {
        try {
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
    }

    private Map<String, Object> mapSupplier(Supplier s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("rut", s.getRut());
        map.put("businessName", s.getBusinessName());
        map.put("name", s.getName());
        map.put("email", s.getEmail());
        map.put("phone", s.getPhone());
        map.put("address", s.getAddress());
        map.put("paymentTerms", s.getPaymentTermDays());
        map.put("isActive", s.getIsActive());
        return map;
    }
}
