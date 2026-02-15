package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.SupplierDto;
import com.poscl.catalog.api.mapper.SupplierMapper;
import com.poscl.catalog.domain.entity.Supplier;
import com.poscl.catalog.domain.repository.SupplierRepository;
import com.poscl.catalog.domain.repository.SupplierProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;
    private final SupplierProductRepository supplierProductRepository;
    private final com.poscl.catalog.domain.repository.ProductVariantRepository productVariantRepository;
    // Will use later for cascade delete or checks
    // private final SupplierProductRepository supplierProductRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierDto> getSuppliers(String tenantId, String filter, Pageable pageable) {
        UUID tenantUuid = UUID.fromString(tenantId);
        if (filter != null && !filter.isEmpty()) {
            return supplierRepository.findByTenantIdAndNombreContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    tenantUuid, filter, filter, pageable)
                    .map(supplierMapper::toDto);
        }
        return supplierRepository.findByTenantId(tenantUuid, pageable)
                .map(supplierMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierDto> getAllActiveSuppliers(String tenantId) {
        return supplierRepository.findByTenantIdAndActivoTrue(UUID.fromString(tenantId))
                .stream()
                .map(supplierMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierDto getSupplier(String tenantId, UUID id) {
        Supplier supplier = getSupplierOrThrow(tenantId, id);
        return supplierMapper.toDto(supplier);
    }

    @Override
    @Transactional
    public SupplierDto createSupplier(String tenantId, SupplierDto supplierDto) {
        Supplier supplier = supplierMapper.toEntity(supplierDto);
        supplier.setTenantId(UUID.fromString(tenantId));
        return supplierMapper.toDto(supplierRepository.save(supplier));
    }

    @Override
    @Transactional
    public SupplierDto updateSupplier(String tenantId, UUID id, SupplierDto supplierDto) {
        Supplier supplier = getSupplierOrThrow(tenantId, id);
        supplierMapper.updateEntityFromDto(supplierDto, supplier);
        return supplierMapper.toDto(supplierRepository.save(supplier));
    }

    @Override
    @Transactional
    public void deleteSupplier(String tenantId, UUID id) {
        Supplier supplier = getSupplierOrThrow(tenantId, id);
        // Soft delete
        supplier.setActivo(false);
        supplierRepository.save(supplier);
    }

    private Supplier getSupplierOrThrow(String tenantId, UUID id) {
        return supplierRepository.findById(id)
                .filter(s -> s.getTenantId().equals(UUID.fromString(tenantId)))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.poscl.catalog.api.dto.SupplierProductDto> getSupplierProducts(String tenantId, UUID supplierId) {
        // Verify tenant
        getSupplierOrThrow(tenantId, supplierId);

        return supplierProductRepository.findBySupplierId(supplierId).stream()
                .map(supplierMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addSupplierProduct(String tenantId, UUID supplierId, com.poscl.catalog.api.dto.SupplierProductDto dto) {
        Supplier supplier = getSupplierOrThrow(tenantId, supplierId);

        // Check if already exists
        supplierProductRepository.findBySupplierId(supplierId).stream()
                .filter(sp -> sp.getProductVariant().getId().equals(dto.getProductVariantId()))
                .findFirst()
                .ifPresent(sp -> {
                    throw new RuntimeException("Product already assigned to this supplier");
                });

        com.poscl.catalog.domain.entity.ProductVariant variant = productVariantRepository
                .findById(dto.getProductVariantId())
                .orElseThrow(() -> new RuntimeException("Product Variant not found"));

        com.poscl.catalog.domain.entity.SupplierProduct entity = com.poscl.catalog.domain.entity.SupplierProduct
                .builder()
                .tenantId(UUID.fromString(tenantId))
                .supplier(supplier)
                .productVariant(variant)
                .supplierSku(dto.getSupplierSku())
                .lastCost(dto.getLastCost())
                .build();

        supplierProductRepository.save(entity);
    }

    @Override
    @Transactional
    public void removeSupplierProduct(String tenantId, UUID supplierId, UUID productVariantId) {
        getSupplierOrThrow(tenantId, supplierId);
        supplierProductRepository.deleteBySupplierIdAndProductVariantId(supplierId, productVariantId);
    }
}
