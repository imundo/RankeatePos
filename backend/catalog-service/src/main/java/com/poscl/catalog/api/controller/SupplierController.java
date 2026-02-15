package com.poscl.catalog.api.controller;

import com.poscl.catalog.api.dto.SupplierDto;
import com.poscl.catalog.application.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Supplier management")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @Operation(summary = "Get suppliers", description = "Get paginated list of suppliers")
    public ResponseEntity<Page<SupplierDto>> getSuppliers(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String filter,
            Pageable pageable) {
        return ResponseEntity.ok(supplierService.getSuppliers(tenantId, filter, pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active suppliers", description = "Get list of all active suppliers for dropdowns")
    public ResponseEntity<List<SupplierDto>> getAllActiveSuppliers(@RequestHeader("X-Tenant-Id") String tenantId) {
        return ResponseEntity.ok(supplierService.getAllActiveSuppliers(tenantId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier", description = "Get supplier by ID")
    public ResponseEntity<SupplierDto> getSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.getSupplier(tenantId, id));
    }

    @PostMapping
    @Operation(summary = "Create supplier", description = "Create a new supplier")
    public ResponseEntity<SupplierDto> createSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody SupplierDto supplierDto) {
        return ResponseEntity.ok(supplierService.createSupplier(tenantId, supplierDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update supplier", description = "Update an existing supplier")
    public ResponseEntity<SupplierDto> updateSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody SupplierDto supplierDto) {
        return ResponseEntity.ok(supplierService.updateSupplier(tenantId, id, supplierDto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete supplier", description = "Soft delete a supplier")
    public ResponseEntity<Void> deleteSupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        supplierService.deleteSupplier(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    // Supplier Products
    @GetMapping("/{id}/products")
    @Operation(summary = "Get supplier products", description = "Get products assigned to a supplier")
    public ResponseEntity<List<com.poscl.catalog.api.dto.SupplierProductDto>> getSupplierProducts(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.getSupplierProducts(tenantId, id));
    }

    @PostMapping("/{id}/products")
    @Operation(summary = "Add supplier product", description = "Assign product to supplier")
    public ResponseEntity<Void> addSupplierProduct(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody com.poscl.catalog.api.dto.SupplierProductDto dto) {
        supplierService.addSupplierProduct(tenantId, id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/products/{variantId}")
    @Operation(summary = "Remove supplier product", description = "Remove product assignment from supplier")
    public ResponseEntity<Void> removeSupplierProduct(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @PathVariable UUID variantId) {
        supplierService.removeSupplierProduct(tenantId, id, variantId);
        return ResponseEntity.noContent().build();
    }
}
