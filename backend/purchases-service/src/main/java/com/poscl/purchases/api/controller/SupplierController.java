package com.poscl.purchases.api.controller;

import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@Tag(name = "Proveedores", description = "Gestión de proveedores")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping
    @Operation(summary = "Listar proveedores")
    public ResponseEntity<Page<Supplier>> getSuppliers(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(supplierRepository.findByTenantIdAndIsActiveOrderByBusinessName(tenantId, true, pageable));
    }

    @PostMapping
    @Operation(summary = "Crear proveedor")
    public ResponseEntity<Supplier> createSupplier(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody Supplier supplier) {
        supplier.setTenantId(tenantId);
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener proveedor por ID")
    public ResponseEntity<Supplier> getSupplierById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return supplierRepository.findById(id)
            .filter(s -> s.getTenantId().equals(tenantId))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
