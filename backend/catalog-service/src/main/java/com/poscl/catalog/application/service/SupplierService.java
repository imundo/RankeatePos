package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.SupplierDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface SupplierService {
    Page<SupplierDto> getSuppliers(String tenantId, String filter, Pageable pageable);

    List<SupplierDto> getAllActiveSuppliers(String tenantId);

    SupplierDto getSupplier(String tenantId, UUID id);

    SupplierDto createSupplier(String tenantId, SupplierDto supplierDto);

    SupplierDto updateSupplier(String tenantId, UUID id, SupplierDto supplierDto);

    void deleteSupplier(String tenantId, UUID id);

    // Supplier Products
    List<com.poscl.catalog.api.dto.SupplierProductDto> getSupplierProducts(String tenantId, UUID supplierId);

    void addSupplierProduct(String tenantId, UUID supplierId, com.poscl.catalog.api.dto.SupplierProductDto dto);

    void removeSupplierProduct(String tenantId, UUID supplierId, UUID productVariantId);
}
