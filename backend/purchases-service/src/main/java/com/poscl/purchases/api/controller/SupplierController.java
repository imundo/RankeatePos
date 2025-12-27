package com.poscl.purchases.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getSuppliers(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        List<Map<String, Object>> suppliers = new ArrayList<>();
        
        suppliers.add(createSupplier("76.100.200-3", "Distribuidora Nacional SpA", "DINASA", "contacto@dinasa.cl", 30));
        suppliers.add(createSupplier("76.200.300-4", "Importadora del Pacífico Ltda", "IMPAC", "ventas@impac.cl", 45));
        suppliers.add(createSupplier("76.300.400-5", "Comercial Norte Grande", "CNG", "pedidos@cng.cl", 30));
        suppliers.add(createSupplier("76.400.500-6", "Alimentos Premium Chile", "APC", "comercial@apc.cl", 60));
        suppliers.add(createSupplier("76.500.600-7", "Tecnología y Servicios TI", "TST", "info@tst.cl", 30));
        
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {
        
        return ResponseEntity.ok(createSupplier("76.100.200-3", "Distribuidora Nacional SpA", "DINASA", "contacto@dinasa.cl", 30));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> supplier = new HashMap<>(request);
        supplier.put("id", UUID.randomUUID().toString());
        supplier.put("isActive", true);
        supplier.put("createdAt", LocalDate.now().toString());
        
        return ResponseEntity.ok(supplier);
    }

    private Map<String, Object> createSupplier(String rut, String businessName, String fantasyName, 
            String email, int paymentTerms) {
        Map<String, Object> supplier = new HashMap<>();
        supplier.put("id", UUID.randomUUID().toString());
        supplier.put("rut", rut);
        supplier.put("businessName", businessName);
        supplier.put("fantasyName", fantasyName);
        supplier.put("email", email);
        supplier.put("phone", "+56 2 2222 3333");
        supplier.put("address", "Av. Principal 1234, Santiago");
        supplier.put("paymentTerms", paymentTerms);
        supplier.put("isActive", true);
        supplier.put("totalOrders", new Random().nextInt(50) + 5);
        supplier.put("totalPurchased", new Random().nextInt(50000000) + 5000000);
        return supplier;
    }
}
